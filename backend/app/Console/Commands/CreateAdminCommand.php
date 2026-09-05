<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Validation\Rules\Password;

/**
 * Securely creates the first administrator. Never hard-code admin
 * credentials: run `php artisan community:create-admin` on the server and
 * answer the prompts (or pass options from a controlled deploy script).
 */
class CreateAdminCommand extends Command
{
    protected $signature = 'community:create-admin
        {--name= : Full name}
        {--email= : Email address}
        {--username= : Username}
        {--password= : Password (avoid; omit to be prompted securely)}';

    protected $description = 'Create an administrator account';

    public function handle(): int
    {
        $name = $this->option('name') ?: $this->ask('Full name');
        $email = $this->option('email') ?: $this->ask('Email address');
        $username = $this->option('username') ?: $this->ask('Username');

        $password = $this->option('password');
        if (! $password) {
            $password = $this->secret('Password (input hidden)');
            $confirm = $this->secret('Confirm password');

            if ($password !== $confirm) {
                $this->error('Passwords do not match.');

                return self::FAILURE;
            }
        }

        $errors = [];

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email address.';
        }
        if (! preg_match('/^[a-zA-Z0-9_-]{3,30}$/', (string) $username)) {
            $errors['username'] = 'Username must be 3-30 letters, numbers, dashes or underscores.';
        }
        if (User::query()->where('email', $email)->exists() || User::query()->where('username', $username)->exists()) {
            $errors['unique'] = 'A user with that email or username already exists.';
        }
        if (! preg_match('/^.{8,}$/', (string) $password)) {
            $errors['password'] = 'Password must be at least 8 characters.';
        }

        if ($errors) {
            foreach ($errors as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'username' => strtolower((string) $username),
            'email' => $email,
            'password' => $password,
            'role' => 'admin',
            'email_verified_at' => now(),
            'notification_preferences' => [
                'answers' => true,
                'comments' => true,
                'mentions' => true,
                'badges' => true,
                'moderation' => true,
            ],
        ]);

        $this->info("Administrator {$user->name} ({$user->email}) created successfully.");

        return self::SUCCESS;
    }
}
