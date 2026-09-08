<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
        $this->configureMorphMap();
    }

    /**
     * Short, stable polymorphic type names in the database.
     */
    protected function configureMorphMap(): void
    {
        \Illuminate\Database\Eloquent\Relations\Relation::enforceMorphMap([
            'question' => \App\Models\Question::class,
            'answer' => \App\Models\Answer::class,
            'comment' => \App\Models\Comment::class,
            'user' => \App\Models\User::class,
        ]);
    }

    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Login / register / password reset — brute-force protection.
        // Tightened to 5/min per IP for the high-value flows.
        RateLimiter::for('auth', function (Request $request) {
            return Limit::perMinute(10)->by('auth:'.$request->ip());
        });

        // Content creation (questions, answers, comments, votes, uploads).
        RateLimiter::for('write', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('search', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('reports', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // OTP verification: tight, by IP and identifier (email/username) so a
        // single attacker cannot flood the endpoint.
        RateLimiter::for('otp.verify', function (Request $request) {
            $identifier = strtolower((string) ($request->input('identifier') ?? ''));
            return [Limit::perMinute(10)->by('otp.verify:'.$request->ip()),
                    Limit::perMinute(10)->by('otp.verify:'.$identifier)];
        });

        // OTP resend: cooldown per account + per IP.
        RateLimiter::for('otp.resend', function (Request $request) {
            $identifier = strtolower((string) ($request->input('identifier') ?? ''));
            return [Limit::perMinute(3)->by('otp.resend:'.$request->ip()),
                    Limit::perHour(8)->by('otp.resend:'.$identifier)];
        });

        // Username availability probe: per-IP rate limit, no per-account
        // enumeration (handled by identical responses for taken/free slugs).
        RateLimiter::for('username.check', function (Request $request) {
            return Limit::perMinute(20)->by('username:'.$request->ip());
        });

        // Registration attempts: per IP and per email, both strict.
        RateLimiter::for('register', function (Request $request) {
            $email = strtolower((string) ($request->input('email') ?? ''));
            return [Limit::perHour(5)->by('register:'.$request->ip()),
                    Limit::perHour(3)->by('register:'.$email)];
        });
    }
}
