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
    }
}
