<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_register_and_get_a_session(): void
    {
        $this->withCredentials()
            ->postJson('/api/v1/auth/register', [
                'name' => 'Tanishq Singh',
                'username' => 'tanishq',
                'email' => 'tanishq@example.test',
                'password' => 'Password123!',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.username', 'tanishq');

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', ['username' => 'tanishq', 'role' => 'user']);
    }

    public function test_registration_validates_unique_and_format(): void
    {
        User::factory()->create(['email' => 'taken@example.test', 'username' => 'taken']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Test',
            'username' => 'taken',
            'email' => 'taken@example.test',
            'password' => 'Password123!',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['username', 'email']);
    }

    public function test_users_can_login_with_email_or_username(): void
    {
        $user = User::factory()->create(['username' => 'meera', 'password' => 'Password123!']);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Password123!'])
            ->assertOk()
            ->assertJsonPath('data.username', 'meera');

        $this->postJson('/api/v1/auth/login', ['email' => 'meera', 'password' => 'Password123!'])
            ->assertOk()
            ->assertJsonPath('data.username', 'meera');
    }

    public function test_login_rejects_bad_credentials(): void
    {
        $user = User::factory()->create(['password' => 'Password123!']);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'wrong-password'])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_suspended_users_cannot_login(): void
    {
        $user = User::factory()->create(['password' => 'Password123!', 'is_suspended' => true, 'suspended_reason' => 'spam']);

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'Password123!'])
            ->assertStatus(403);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $this->withCredentials()
            ->actingAs($user)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->app->make('auth')->forgetGuards();
        $this->assertGuest();
    }

    public function test_password_reset_flow(): void
    {
        $user = User::factory()->create(['password' => 'OldPassword123!']);

        \Illuminate\Support\Facades\Notification::fake();

        Password::sendResetLink(['email' => $user->email]);

        $token = null;
        \Illuminate\Support\Facades\Notification::assertSentTo(
            $user,
            \App\Notifications\ResetPasswordNotification::class,
            function ($notification) use (&$token) {
                $token = $notification->token;

                return true;
            }
        );

        $this->assertNotNull($token);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'NewPassword123!'])
            ->assertOk();
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }
}
