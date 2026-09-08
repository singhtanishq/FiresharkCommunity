<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\OtpChallenge;
use App\Models\User;
use App\Services\AccountSecurityService;
use App\Services\OtpService;
use App\Services\ZeptoMailService;
use App\Support\ApiResponse;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class PasswordResetController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected OtpService $otps,
        protected ZeptoMailService $mailer,
        protected AccountSecurityService $security,
    ) {
    }

    /**
     * Step 1: the user enters their email. The system issues a short-lived
     * email-OTP challenge; the actual password-reset link is delivered
     * only after they verify the code, so a leaked link alone is useless.
     */
    public function forgot(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email', 'max:191']]);
        $email = strtolower($request->input('email'));

        $user = User::query()->where('email', $email)->first();

        // Always return a neutral message — no account enumeration.
        if (! $user) {
            return $this->success([
                'message' => 'If an account exists for that address, a verification code has been sent.',
            ]);
        }

        $challenge = $this->otps->issue(OtpChallenge::PURPOSE_PASSWORD_RESET, $email, $user, $request);

        return $this->success([
            'message' => 'If an account exists for that address, a verification code has been sent.',
            'token' => $challenge->token,
            'expires_at' => $challenge->expires_at,
        ]);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email', 'max:191']]);
        $email = strtolower($request->input('email'));

        $user = User::query()->where('email', $email)->first();
        if (! $user) {
            return $this->success(['message' => 'If an account exists for that address, a verification code has been sent.']);
        }

        $existing = OtpChallenge::query()
            ->where('purpose', OtpChallenge::PURPOSE_PASSWORD_RESET)
            ->where('identifier', $email)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('updated_at')
            ->first();

        try {
            $challenge = $existing
                ? $this->otps->resend($existing, $request)
                : $this->otps->issue(OtpChallenge::PURPOSE_PASSWORD_RESET, $email, $user, $request);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), 429);
        }

        return $this->success([
            'message' => 'If an account exists for that address, a verification code has been sent.',
            'token' => $challenge->token,
            'expires_at' => $challenge->expires_at,
        ]);
    }

    /**
     * Step 2: the user submits the OTP code. We return a short-lived
     * single-use password-reset token (used in step 3) to prove that the
     * caller controls the email inbox without exposing any long-lived
     * secret in the URL.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:191'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $email = strtolower($data['email']);
        $token = $request->header('X-OTP-Token') ?: '';
        $challenge = $this->otps->findOpen(OtpChallenge::PURPOSE_PASSWORD_RESET, $email, $token);

        if (! $challenge) {
            return $this->error('No active verification code. Please request a new one.', 410);
        }

        $result = $this->otps->verify($challenge, $data['code']);
        if (! $result['ok']) {
            return $this->handleVerifyResult($result, $email);
        }

        // Issue a short-lived reset token. The frontend sends it to /reset
        // together with the new password. Lifetime is 10 minutes; the user
        // can request a new one at any time.
        $resetToken = Str::random(64);

        Cache::put("password-reset:{$email}:{$resetToken}", [
            'user_id' => $challenge->user_id,
            'issued_at' => now()->toIso8601String(),
        ], now()->addMinutes(10));

        return $this->success([
            'verified' => true,
            'reset_token' => $resetToken,
            'expires_in' => 600,
        ]);
    }

    /**
     * Step 3: the user submits the new password with the reset token. We
     * rotate the password and revoke all sessions for the user.
     */
    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:191'],
            'reset_token' => ['required', 'string', 'size:64'],
            'password' => ['required', 'string', PasswordRule::min(8), 'confirmed'],
        ]);

        $email = strtolower($data['email']);
        $cacheKey = "password-reset:{$email}:{$data['reset_token']}";
        $payload = Cache::get($cacheKey);

        if (! $payload || ($payload['user_id'] ?? null) !== User::query()->where('email', $email)->value('id')) {
            throw ValidationException::withMessages([
                'reset_token' => 'This reset token is invalid or has expired.',
            ]);
        }

        $user = User::findOrFail($payload['user_id']);
        $user->forceFill([
            'password' => Hash::make($data['password']),
            'remember_token' => Str::random(60),
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ])->save();

        Cache::forget($cacheKey);

        // Invalidate any outstanding OTPs for the user.
        OtpChallenge::query()
            ->where('identifier', $email)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        // Invalidate existing sessions on other devices by rotating the
        // remember_token and forcing the next request to reauthenticate.
        Auth::guard('web')->logoutOtherDevices($data['password']);

        event(new PasswordReset($user));

        return $this->success(null, 'Your password has been reset. You can now log in.');
    }

    protected function handleVerifyResult(array $result, string $identifier): JsonResponse
    {
        return match ($result['reason'] ?? null) {
            'expired' => $this->error('This verification code has expired. Request a new one.', 410),
            'consumed' => $this->error('This code has already been used. Request a new one.', 410),
            'locked' => $this->error('Too many attempts. Please try again in 5 minutes.', 423),
            'invalid' => $this->error(
                'That verification code is incorrect. '.($result['challenge'] ?? null)
                    ? $result['challenge']->remainingAttempts().' attempt(s) remaining.'
                    : 'Request a new code.',
                422
            ),
            default => $this->error('Verification failed. Request a new code.', 422),
        };
    }
}
