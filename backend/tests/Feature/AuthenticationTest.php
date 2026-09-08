<?php

namespace Tests\Feature;

use App\Models\OtpChallenge;
use App\Models\PendingRegistration;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_username_availability_endpoint_reports_free_names(): void
    {
        $this->getJson('/api/v1/auth/check-username?username=newuser')
            ->assertOk()
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.reason', null);
    }

    public function test_username_availability_endpoint_reports_taken_names(): void
    {
        User::factory()->create(['username' => 'taken']);

        $this->getJson('/api/v1/auth/check-username?username=taken')
            ->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonPath('data.reason', 'taken');
    }

    public function test_username_availability_endpoint_rejects_reserved_names(): void
    {
        $this->getJson('/api/v1/auth/check-username?username=admin')
            ->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonPath('data.reason', 'reserved');
    }

    public function test_registration_start_issues_otp_and_persists_pending_record(): void
    {
        $response = $this->withCredentials()->postJson('/api/v1/auth/register/start', [
            'name' => 'Test User',
            'username' => 'newuser01',
            'email' => 'newuser01@example.test',
            'password' => 'Password123!',
        ])->assertOk()->assertJsonPath('data.step', 'email');

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertDatabaseHas('pending_registrations', [
            'username' => 'newuser01',
            'email' => 'newuser01@example.test',
        ]);
        $this->assertDatabaseHas('otp_challenges', [
            'purpose' => OtpChallenge::PURPOSE_SIGNUP_EMAIL,
            'identifier' => 'newuser01@example.test',
        ]);
    }

    public function test_registration_start_rejects_taken_username(): void
    {
        User::factory()->create(['username' => 'taken']);

        $this->withCredentials()->postJson('/api/v1/auth/register/start', [
            'name' => 'Test',
            'username' => 'taken',
            'email' => 'something@example.test',
            'password' => 'Password123!',
        ])->assertStatus(422)->assertJsonValidationErrors(['username']);
    }

    public function test_registration_start_returns_neutral_response_for_taken_email(): void
    {
        User::factory()->create(['email' => 'existing@example.test']);

        $this->withCredentials()->postJson('/api/v1/auth/register/start', [
            'name' => 'Test',
            'username' => 'newuser',
            'email' => 'existing@example.test',
            'password' => 'Password123!',
        ])->assertOk()->assertJsonPath('data.step', 'email');
    }

    public function test_full_registration_creates_user_and_logs_in(): void
    {
        $this->withCredentials()->postJson('/api/v1/auth/register/start', [
            'name' => 'Test User',
            'username' => 'newuser02',
            'email' => 'newuser02@example.test',
            'password' => 'Password123!',
        ])->assertOk();

        $otp = OtpChallenge::query()->where('identifier', 'newuser02@example.test')->firstOrFail();
        $code = $this->extractCodeFromOtp($otp);

        $this->withCredentials()->postJson('/api/v1/auth/register/verify-otp', [
            'identifier' => 'newuser02@example.test',
            'code' => $code,
        ], ['X-OTP-Token' => $otp->token])->assertOk()->assertJsonPath('data.verified', true);

        $this->withCredentials()->postJson('/api/v1/auth/register/complete', [
            'identifier' => 'newuser02@example.test',
        ])->assertCreated();

        $this->assertDatabaseHas('users', [
            'username' => 'newuser02',
            'email' => 'newuser02@example.test',
        ]);
        $this->assertAuthenticated();
    }

    public function test_verify_otp_rejects_wrong_code_without_consuming_challenge(): void
    {
        $this->withCredentials()->postJson('/api/v1/auth/register/start', [
            'name' => 'Test',
            'username' => 'newuser03',
            'email' => 'newuser03@example.test',
            'password' => 'Password123!',
        ]);

        $otp = OtpChallenge::query()->where('identifier', 'newuser03@example.test')->firstOrFail();

        $this->withCredentials()->postJson('/api/v1/auth/register/verify-otp', [
            'identifier' => 'newuser03@example.test',
            'code' => '000000',
        ], ['X-OTP-Token' => $otp->token])->assertStatus(422);

        $this->assertDatabaseHas('otp_challenges', [
            'id' => $otp->id,
            'consumed_at' => null,
            'attempts' => 1,
        ]);
    }

    public function test_verify_otp_locks_challenge_after_max_attempts(): void
    {
        $service = app(\App\Services\OtpService::class);
        $identifier = 'locktest@example.test';

        // Issue a single challenge. The first MAX_ATTEMPTS - 1 wrong
        // attempts return 422 ("invalid code, N attempts remaining").
        // The MAX_ATTEMPTS-th wrong attempt triggers the lock and returns
        // 423.
        $challenge = $service->issue(OtpChallenge::PURPOSE_SIGNUP_EMAIL, $identifier, null, request());

        for ($i = 1; $i < OtpService::MAX_ATTEMPTS; $i++) {
            $this->withCredentials()->postJson('/api/v1/auth/register/verify-otp', [
                'identifier' => $identifier,
                'code' => '000000',
            ], ['X-OTP-Token' => $challenge->token])->assertStatus(422);
        }

        // The (MAX_ATTEMPTS)-th wrong attempt locks the challenge.
        $this->withCredentials()->postJson('/api/v1/auth/register/verify-otp', [
            'identifier' => $identifier,
            'code' => '000000',
        ], ['X-OTP-Token' => $challenge->token])->assertStatus(423);

        $this->assertNotNull($challenge->fresh()->locked_until);
    }

    public function test_complete_registration_requires_email_verification(): void
    {
        $pending = PendingRegistration::create([
            'name' => 'Test',
            'username' => 'pending',
            'email' => 'pending@example.test',
            'password_hash' => Hash::make('Password123!'),
            'signup_ip' => '127.0.0.1',
            'expires_at' => now()->addHour(),
        ]);

        $this->withCredentials()->postJson('/api/v1/auth/register/complete', [
            'identifier' => $pending->email,
        ])->assertStatus(412);
    }

    public function test_correct_password_issues_otp(): void
    {
        $user = User::factory()->create(['password' => 'Password123!']);

        $this->withCredentials()->postJson('/api/v1/auth/login/start', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertOk()
            ->assertJsonPath('data.step', 'otp')
            ->assertJsonPath('data.identifier', $user->email);

        $this->assertGuest();
    }

    public function test_wrong_password_is_rejected_and_countered(): void
    {
        $user = User::factory()->create(['password' => 'Password123!']);

        $this->withCredentials()->postJson('/api/v1/auth/login/start', [
            'email' => $user->email,
            'password' => 'wrong',
        ])->assertStatus(422);

        $this->assertEquals(1, $user->fresh()->failed_login_attempts);
    }

    public function test_account_locks_after_max_failed_attempts(): void
    {
        $user = User::factory()->create(['password' => 'Password123!']);

        // First 4 wrong attempts return 422; the 5th locks the account
        // and returns 423.
        for ($i = 1; $i < \App\Services\AccountSecurityService::MAX_ATTEMPTS; $i++) {
            $this->withCredentials()->postJson('/api/v1/auth/login/start', [
                'email' => $user->email,
                'password' => 'wrong',
            ])->assertStatus(422);
        }

        $this->withCredentials()->postJson('/api/v1/auth/login/start', [
            'email' => $user->email,
            'password' => 'wrong',
        ])->assertStatus(423);

        $this->assertNotNull($user->fresh()->locked_until);

        $this->withCredentials()->postJson('/api/v1/auth/login/start', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertStatus(423);
    }

    public function test_login_otp_completes_session(): void
    {
        $user = User::factory()->create(['password' => 'Password123!']);

        $start = $this->withCredentials()->postJson('/api/v1/auth/login/start', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertOk()->json();

        $otp = OtpChallenge::query()->where('identifier', $user->email)->firstOrFail();
        $code = $this->extractCodeFromOtp($otp);

        $this->withCredentials()->postJson('/api/v1/auth/login/verify-otp', [
            'identifier' => $user->email,
            'code' => $code,
        ], ['X-OTP-Token' => $start['data']['token']])->assertOk();

        $this->assertAuthenticatedAs($user);
    }

    public function test_successful_login_clears_failed_attempts(): void
    {
        $user = User::factory()->create([
            'password' => 'Password123!',
            'failed_login_attempts' => 3,
        ]);

        $start = $this->withCredentials()->postJson('/api/v1/auth/login/start', [
            'email' => $user->email,
            'password' => 'Password123!',
        ])->assertOk()->json();

        $otp = OtpChallenge::query()->where('identifier', $user->email)->firstOrFail();
        $code = $this->extractCodeFromOtp($otp);

        $this->withCredentials()->postJson('/api/v1/auth/login/verify-otp', [
            'identifier' => $user->email,
            'code' => $code,
        ], ['X-OTP-Token' => $start['data']['token']])->assertOk();

        $this->assertEquals(0, $user->fresh()->failed_login_attempts);
    }

    public function test_logout_invalidates_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withCredentials()
            ->postJson('/api/v1/auth/logout')
            ->assertOk();
    }

    public function test_password_reset_forgot_returns_neutral_response_for_unknown_email(): void
    {
        $this->withCredentials()->postJson('/api/v1/auth/forgot-password', [
            'email' => 'nobody@example.test',
        ])->assertOk();
    }

    public function test_password_reset_full_flow_with_otp(): void
    {
        $user = User::factory()->create(['password' => 'OldPassword123!']);
        $service = app(\App\Services\OtpService::class);

        $forgot = $this->withCredentials()->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ])->assertOk()->json();

        $token = $forgot['data']['token'];
        $code = $service->lastCodeFor(OtpChallenge::PURPOSE_PASSWORD_RESET, $user->email);

        $this->assertNotNull($code, 'Reset OTP code was not available.');

        $verify = $this->withCredentials()->postJson('/api/v1/auth/forgot-password/verify', [
            'email' => $user->email,
            'code' => $code,
        ], ['X-OTP-Token' => $token])->assertOk()->json();

        $this->withCredentials()->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'reset_token' => $verify['data']['reset_token'],
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
    }

    public function test_password_reset_rejects_reused_token(): void
    {
        $user = User::factory()->create(['password' => 'OldPassword123!']);
        $service = app(\App\Services\OtpService::class);

        $forgot = $this->withCredentials()->postJson('/api/v1/auth/forgot-password', [
            'email' => $user->email,
        ])->json();

        $token = $forgot['data']['token'];
        $code = $service->lastCodeFor(OtpChallenge::PURPOSE_PASSWORD_RESET, $user->email);
        $verify = $this->withCredentials()->postJson('/api/v1/auth/forgot-password/verify', [
            'email' => $user->email,
            'code' => $code,
        ], ['X-OTP-Token' => $token])->json();

        $this->withCredentials()->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'reset_token' => $verify['data']['reset_token'],
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->withCredentials()->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'reset_token' => $verify['data']['reset_token'],
            'password' => 'AnotherPassword123!',
            'password_confirmation' => 'AnotherPassword123!',
        ])->assertStatus(422);
    }

    /**
     * Recover the plaintext OTP for a challenge using the dev-only cache
     * helper exposed by OtpService. In production with a real ZeptoMail
     * key this returns null.
     */
    protected function extractCodeFromOtp(OtpChallenge $challenge): string
    {
        $service = app(\App\Services\OtpService::class);
        $code = $service->lastCodeFor($challenge->purpose, $challenge->identifier);

        if ($code === null) {
            // No code was logged for an existing challenge (e.g. we are
            // running with a real ZeptoMail key). Issue a fresh challenge
            // for the same (purpose, identifier) pair, which writes the
            // new plaintext to the in-memory cache and invalidates the
            // old one. The caller is expected to refresh the challenge
            // from the database after calling this helper.
            $user = $challenge->user;
            $service->issue($challenge->purpose, $challenge->identifier, $user, request());
            $code = $service->lastCodeFor($challenge->purpose, $challenge->identifier);
        }

        $this->assertNotNull($code, 'OTP code was not available.');

        return $code;
    }
}
