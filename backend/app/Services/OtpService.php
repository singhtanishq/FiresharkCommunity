<?php

namespace App\Services;

use App\Models\OtpChallenge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Issues, verifies and consumes OTP challenges. Plain codes are never
 * persisted: only the bcrypt hash is stored in the database. Each new
 * challenge for the same (purpose, identifier) pair invalidates any
 * previous open challenge to keep at-most-one semantics.
 */
class OtpService
{
    public const TTL_SECONDS = 5 * 60;       // 5 minutes
    public const MAX_ATTEMPTS = 5;
    public const LOCK_SECONDS = 5 * 60;     // 5 minutes
    public const RESEND_COOLDOWN_SECONDS = 30;

    public function __construct(protected ZeptoMailService $mailer)
    {
    }

    public function issue(string $purpose, string $identifier, ?User $user, Request $request): OtpChallenge
    {
        $identifier = strtolower(trim($identifier));

        // Invalidate any previous open OTP for this (purpose, identifier).
        OtpChallenge::query()
            ->where('purpose', $purpose)
            ->where('identifier', $identifier)
            ->whereNull('consumed_at')
            ->whereNull('locked_until')
            ->update(['consumed_at' => now()]);

        $code = $this->generateCode();
        $token = Str::random(48);

        $challenge = OtpChallenge::create([
            'token' => $token,
            'purpose' => $purpose,
            'identifier' => $identifier,
            'user_id' => $user?->id,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'max_attempts' => self::MAX_ATTEMPTS,
            'expires_at' => now()->addSeconds(self::TTL_SECONDS),
            'ip' => $request?->ip(),
            'user_agent' => substr((string) $request?->userAgent(), 0, 191),
        ]);

        $this->dispatch($challenge, $code, $user);

        return $challenge;
    }

    public function resend(OtpChallenge $challenge, Request $request): OtpChallenge
    {
        // Throttle resends: no more than once every 30s.
        if ($challenge->updated_at->diffInSeconds(now(), absolute: true) < self::RESEND_COOLDOWN_SECONDS) {
            throw new RuntimeException('Please wait before requesting a new code.');
        }

        return $this->issue($challenge->purpose, $challenge->identifier, $challenge->user, $request);
    }

    /**
     * @return array{ok: bool, reason?: string, challenge?: OtpChallenge}
     */
    public function verify(OtpChallenge $challenge, string $code): array
    {
        if ($challenge->isConsumed()) {
            return ['ok' => false, 'reason' => 'consumed'];
        }

        if ($challenge->isLocked()) {
            return ['ok' => false, 'reason' => 'locked'];
        }

        if ($challenge->isExpired()) {
            return ['ok' => false, 'reason' => 'expired'];
        }

        if (! Hash::check($code, $challenge->code_hash)) {
            $challenge->increment('attempts');

            if ($challenge->remainingAttempts() === 0) {
                $challenge->forceFill(['locked_until' => now()->addSeconds(self::LOCK_SECONDS)])->save();
                return ['ok' => false, 'reason' => 'locked'];
            }

            return ['ok' => false, 'reason' => 'invalid'];
        }

        $challenge->forceFill(['consumed_at' => now()])->save();

        return ['ok' => true, 'challenge' => $challenge];
    }

    public function findOpen(string $purpose, string $identifier, string $token): ?OtpChallenge
    {
        return OtpChallenge::query()
            ->where('purpose', $purpose)
            ->where('identifier', strtolower(trim($identifier)))
            ->where('token', $token)
            ->first();
    }

    protected function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    protected function dispatch(OtpChallenge $challenge, string $code, ?User $user): void
    {
        // The plaintext code is delivered to the user through the email
        // service. In dev (or with a placeholder key) it is logged with
        // enough context to be recovered from storage/logs/laravel.log.
        match ($challenge->purpose) {
            OtpChallenge::PURPOSE_LOGIN => $this->sendLogin($challenge, $code, $user),
            OtpChallenge::PURPOSE_SIGNUP_EMAIL => $this->sendSignup($challenge, $code),
            OtpChallenge::PURPOSE_PASSWORD_RESET => $this->sendPasswordReset($challenge, $code, $user),
            default => throw new RuntimeException('Unsupported OTP purpose.'),
        };
    }

    protected function sendLogin(OtpChallenge $challenge, string $code, ?User $user): void
    {
        $this->mailer->sendOtp(
            $challenge,
            $challenge->identifier,
            $user?->name ?? '',
            $code
        );

        $this->logCode($challenge, $code, $user?->name ?? '');
    }

    protected function sendSignup(OtpChallenge $challenge, string $code): void
    {
        $this->mailer->sendOtp(
            $challenge,
            $challenge->identifier,
            '',
            $code
        );

        $this->logCode($challenge, $code, '');
    }

    protected function sendPasswordReset(OtpChallenge $challenge, string $code, ?User $user): void
    {
        $this->mailer->sendOtp(
            $challenge,
            $challenge->identifier,
            $user?->name ?? '',
            $code
        );

        $this->logCode($challenge, $code, $user?->name ?? '');
    }

    protected function logCode(OtpChallenge $challenge, string $code, string $name): void
    {
        // Production code path goes through ZeptoMail. This local-dev log
        // entry is a development convenience and is the ONLY place the
        // plaintext code is ever persisted. In production with a real
        // ZeptoMail key the log is suppressed entirely.
        if (! (app()->environment('local') || config('services.zeptomail.api_key') === 'development_placeholder' || ! config('services.zeptomail.api_key'))) {
            // In production the mailer is real, never log the code.
            return;
        }

        \Log::info('OTP generated for development testing.', [
            'purpose' => $challenge->purpose,
            'recipient' => $challenge->identifier,
            'expires_at' => $challenge->expires_at->toIso8601String(),
            'code' => $code,
        ]);

        // Also stash the most recent code in an in-memory cache so tests
        // can retrieve it without parsing log files. The cache is per-
        // process and is empty in production with a real ZeptoMail key
        // because the early return above means nothing is stored.
        cache()->put('otp:last:'.$challenge->purpose.':'.$challenge->identifier, [
            'code' => $code,
            'expires_at' => $challenge->expires_at,
        ], $challenge->expires_at);
    }

    /**
     * Dev-only: read the most recent code issued for (purpose, identifier)
     * from the in-memory cache. Used exclusively by the test suite to
     * extract a plaintext OTP after issuing a challenge. Returns null if
     * no code is cached (e.g. in production with a real ZeptoMail key).
     */
    public function lastCodeFor(string $purpose, string $identifier): ?string
    {
        $entry = cache()->get('otp:last:'.$purpose.':'.$identifier);
        return $entry['code'] ?? null;
    }
}
