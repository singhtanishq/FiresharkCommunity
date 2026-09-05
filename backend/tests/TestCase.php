<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    // Reputation rules, badges and categories are required by nearly every
    // test, so seed them with the refreshed database.
    public bool $seed = true;

    protected function setUp(): void
    {
        parent::setUp();

        // Tests exercise the API the same way the SPA does: with a session.
        $this->withHeaders(['Origin' => 'http://localhost:5173', 'Accept' => 'application/json']);
    }

    protected function signIn(?User $user = null): User
    {
        $user ??= User::factory()->create();

        $this->actingAs($user);

        // Mark verified so write actions are permitted (registration flow
        // normally handles this; REQUIRE_EMAIL_VERIFICATION=false in tests).
        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return $user->refresh();
    }
}
