<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserSummaryResource;
use App\Models\OtpChallenge;
use App\Models\PendingRegistration;
use App\Models\User;
use App\Services\AccountSecurityService;
use App\Services\OtpService;
use App\Services\ZeptoMailService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AuthController extends Controller
{
    use ApiResponse;

    public const RESERVED_USERNAMES = [
        'admin', 'administrator', 'root', 'support', 'staff', 'moderator',
        'fireshark', 'fire-shark', 'system', 'official', 'help', 'about',
    ];

    public function __construct(
        protected OtpService $otps,
        protected ZeptoMailService $mailer,
        protected AccountSecurityService $security,
    ) {
    }

    // ------------------------------------------------------------------
    // Username availability
    // ------------------------------------------------------------------

    public function checkUsername(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:30', 'alpha_dash'],
        ]);

        $username = strtolower($request->input('username'));

        $reserved = in_array($username, self::RESERVED_USERNAMES, true);

        $exists = ! $reserved && User::query()->where('username', $username)->exists();
        $pendingExists = ! $reserved && PendingRegistration::query()->where('username', $username)->exists();

        $available = ! $reserved && ! $exists && ! $pendingExists;

        return $this->success([
            'username' => $username,
            'available' => $available,
            'reason' => $reserved ? 'reserved' : ($exists || $pendingExists ? 'taken' : null),
        ]);
    }

    // ------------------------------------------------------------------
    // Registration: multi-step
    // ------------------------------------------------------------------

    public function startRegistration(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'username' => ['required', 'string', 'min:3', 'max:30', 'alpha_dash'],
            'email' => ['required', 'string', 'email', 'max:191'],
            'password' => ['required', 'string', Password::min(8)],
        ]);

        $username = strtolower($data['username']);
        $email = strtolower($data['email']);

        if (in_array($username, self::RESERVED_USERNAMES, true)) {
            throw ValidationException::withMessages(['username' => ['That username is reserved.']]);
        }

        if (User::query()->where('email', $email)->exists()
            || PendingRegistration::query()->where('email', $email)->exists()) {
            return $this->success([
                'step' => 'email',
                'identifier' => $email,
                'message' => 'If the email is usable, a verification code has been sent.',
            ]);
        }

        if (User::query()->where('username', $username)->exists()
            || PendingRegistration::query()->where('username', $username)->exists()) {
            throw ValidationException::withMessages(['username' => ['That username is already taken.']]);
        }

        $pending = PendingRegistration::create([
            'name' => $data['name'],
            'username' => $username,
            'email' => $email,
            'password_hash' => Hash::make($data['password']),
            'signup_ip' => $request->ip(),
            'expires_at' => now()->addHours(2),
        ]);

        $challenge = $this->otps->issue(OtpChallenge::PURPOSE_SIGNUP_EMAIL, $email, null, $request);

        return $this->success([
            'step' => 'email',
            'identifier' => $email,
            'token' => $challenge->token,
            'expires_at' => $challenge->expires_at,
            'message' => 'Verification code sent. Please check your inbox.',
        ]);
    }

    public function verifySignup(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:191'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $identifier = strtolower($data['identifier']);
        $token = $request->header('X-OTP-Token') ?: '';
        $challenge = $this->otps->findOpen(OtpChallenge::PURPOSE_SIGNUP_EMAIL, $identifier, $token);

        if (! $challenge) {
            return $this->error('No active verification code. Please request a new one.', 410);
        }

        $result = $this->otps->verify($challenge, $data['code']);

        if (! $result['ok']) {
            return $this->handleVerifyResult($result, $identifier, 'signup');
        }

        // Mark the pending registration as email-verified so the complete
        // step can create the user record.
        PendingRegistration::query()
            ->where('email', $identifier)
            ->where('expires_at', '>', now())
            ->update(['email_verified_at' => now()]);

        return $this->success(['verified' => true, 'identifier' => $identifier]);
    }

    public function resendSignupOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'email', 'max:191'],
        ]);

        $identifier = strtolower($data['identifier']);
        $existing = OtpChallenge::query()
            ->where('purpose', OtpChallenge::PURPOSE_SIGNUP_EMAIL)
            ->where('identifier', $identifier)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('updated_at')
            ->first();

        try {
            $challenge = $existing
                ? $this->otps->resend($existing, $request)
                : $this->otps->issue(OtpChallenge::PURPOSE_SIGNUP_EMAIL, $identifier, null, $request);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), 429);
        }

        return $this->success([
            'token' => $challenge->token,
            'expires_at' => $challenge->expires_at,
            'message' => 'A new verification code has been sent.',
        ]);
    }

    public function completeRegistration(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'email', 'max:191'],
        ]);

        $pending = PendingRegistration::query()
            ->where('email', strtolower($data['identifier']))
            ->whereNotNull('email_verified_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $pending) {
            return $this->error('Please complete the email verification step first.', 412);
        }

        $user = User::create([
            'name' => $pending->name,
            'username' => $pending->username,
            'email' => $pending->email,
            'password' => $pending->password_hash,
            'notification_preferences' => [
                'answers' => true,
                'comments' => true,
                'mentions' => true,
                'badges' => true,
                'moderation' => true,
            ],
        ]);

        // Force-set the email_verified_at timestamp because it is not in
        // the User model's $fillable mass-assignment allowlist.
        $user->forceFill(['email_verified_at' => $pending->email_verified_at])->save();

        $pending->delete();

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $this->security->recordSuccessfulLogin($user);

        return $this->success(
            new UserSummaryResource($user),
            'Welcome to the FireShark Community! Your account has been created.',
            201
        );
    }

    // ------------------------------------------------------------------
    // Login: password stage -> OTP stage -> session
    // ------------------------------------------------------------------

    public function startLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'max:191'],
            'password' => ['required', 'string'],
        ]);

        $identifier = mb_strtolower($data['email']);
        $field = filter_var($data['email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::query()->where($field, $identifier)->first();

        // Generic error to avoid account enumeration, but we still record
        // the failed attempt for *existing* accounts.
        $ok = $user && Hash::check($data['password'], $user->password);

        if (! $user) {
            throw ValidationException::withMessages(['email' => 'Email or password is incorrect.']);
        }

        if ($this->security->isLocked($user)) {
            return $this->error(
                'Too many attempts. Please try again in '.ceil($this->security->remainingLockSeconds($user) / 60).' minutes.',
                423
            );
        }

        if ($user->is_suspended) {
            return $this->error(
                'Your account has been suspended. Contact support if you believe this is a mistake.',
                403
            );
        }

        if (! $ok) {
            $this->security->recordFailedPassword($user, $request->ip());
            if ($this->security->isLocked($user)) {
                return $this->error(
                    'Too many attempts. Please try again in '.ceil((int) ceil(AccountSecurityService::LOCK_SECONDS / 60)).' minutes.',
                    423
                );
            }
            throw ValidationException::withMessages(['email' => 'Email or password is incorrect.']);
        }

        $challenge = $this->otps->issue(OtpChallenge::PURPOSE_LOGIN, $user->email, $user, $request);

        return $this->success([
            'step' => 'otp',
            'identifier' => $user->email,
            'token' => $challenge->token,
            'expires_at' => $challenge->expires_at,
            'resend_after' => $challenge->expires_at->copy()->subSeconds(OtpService::TTL_SECONDS - OtpService::RESEND_COOLDOWN_SECONDS),
            'message' => 'A verification code has been sent to your email.',
        ]);
    }

    public function verifyLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'email', 'max:191'],
            'code' => ['required', 'string', 'size:6'],
        ]);

        $identifier = strtolower($data['identifier']);
        $token = $request->header('X-OTP-Token') ?: '';
        $challenge = $this->otps->findOpen(OtpChallenge::PURPOSE_LOGIN, $identifier, $token);

        if (! $challenge) {
            return $this->error('No active sign-in code. Please request a new one.', 410);
        }

        $result = $this->otps->verify($challenge, $data['code']);
        $response = $this->handleVerifyResult($result, $identifier, 'login');

        if (! $result['ok']) {
            return $response;
        }

        $user = $result['challenge']->user;

        if (! $user || $this->security->isLocked($user)) {
            return $this->error('Account is temporarily locked. Please try again later.', 423);
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $this->security->recordSuccessfulLogin($user);
        $user->markActivity();

        return $this->success(
            new UserSummaryResource($user),
            'Logged in successfully.'
        );
    }

    public function resendLoginOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'email', 'max:191'],
        ]);

        $identifier = strtolower($data['identifier']);
        $user = User::query()->where('email', $identifier)->first();

        // Always return a success to avoid account enumeration.
        if (! $user) {
            return $this->success(['message' => 'A new code has been sent if the email is on file.']);
        }

        $existing = OtpChallenge::query()
            ->where('purpose', OtpChallenge::PURPOSE_LOGIN)
            ->where('identifier', $identifier)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderByDesc('updated_at')
            ->first();

        try {
            $challenge = $existing
                ? $this->otps->resend($existing, $request)
                : $this->otps->issue(OtpChallenge::PURPOSE_LOGIN, $identifier, $user, $request);
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), 429);
        }

        return $this->success([
            'token' => $challenge->token,
            'expires_at' => $challenge->expires_at,
            'message' => 'A new code has been sent if the email is on file.',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->success(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadCount(['questions', 'answers', 'badges']);

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'email_verified' => $user->hasVerifiedEmail(),
            'avatar_path' => $user->avatar_path,
            'bio' => $user->bio,
            'expertise' => $user->expertise,
            'location' => $user->location,
            'website' => $user->website,
            'role' => $user->role->value,
            'reputation' => $user->reputation,
            'questions_count' => $user->questions_count,
            'answers_count' => $user->answers_count,
            'accepted_answers_count' => $user->accepted_answers_count,
            'badges_count' => $user->badges_count,
            'notification_preferences' => $user->notification_preferences,
            'created_at' => $user->created_at,
        ]);
    }

    // ------------------------------------------------------------------
    // Shared verify result handler
    // ------------------------------------------------------------------

    protected function handleVerifyResult(array $result, string $identifier, string $purpose): JsonResponse
    {
        if ($result['ok']) {
            return $this->success(['verified' => true, 'identifier' => $identifier]);
        }

        $challenge = $result['challenge'] ?? null;

        return match ($result['reason']) {
            'expired' => $this->error('This verification code has expired. Request a new code.', 410),
            'consumed' => $this->error('This code has already been used. Request a new one.', 410),
            'locked' => $this->error('Too many attempts. Please try again in 5 minutes.', 423),
            default => $this->error(
                "That verification code is incorrect. ".($challenge ? $challenge->remainingAttempts().' attempt(s) remaining.' : 'Request a new code.'),
                422
            ),
        };
    }
}
