<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        $name = fake()->unique()->name();

        return [
            'name' => $name,
            'username' => Str::lower(Str::slug($name)).'_'.Str::lower(Str::random(4)),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'user',
            'remember_token' => Str::random(10),
            'notification_preferences' => [
                'answers' => true,
                'comments' => true,
                'mentions' => true,
                'badges' => true,
                'moderation' => true,
            ],
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function moderator(): static
    {
        return $this->state(fn () => ['role' => 'moderator']);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin']);
    }
}
