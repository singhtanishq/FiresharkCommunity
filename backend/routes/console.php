<?php

use App\Models\OtpChallenge;
use App\Models\PendingRegistration;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled tasks (run via `php artisan schedule:run` from cron)
|--------------------------------------------------------------------------
|
| On Hostinger the cron entry `php artisan schedule:run` runs every minute;
| the scheduler only fires the commands below when they are due.
|
*/

// Finalize the previous month's leaderboard shortly after midnight on the 1st.
Schedule::command('community:finalize-leaderboard')
    ->monthlyOn(1, '00:10')
    ->withoutOverlapping();

// Prune stale password reset tokens and notifications.
Schedule::command('model:prune')->daily();

// Clean up expired pending registrations (older than 2 hours).
Schedule::call(function () {
    $deleted = PendingRegistration::query()
        ->where('expires_at', '<', now())
        ->delete();

    if ($deleted > 0) {
        \Log::info("Cleaned up {$deleted} expired pending registrations");
    }
})->hourly()->withoutOverlapping();

// Clean up consumed/expired OTP challenges (older than 24 hours).
Schedule::call(function () {
    $deleted = OtpChallenge::query()
        ->where(function ($query) {
            $query->whereNotNull('consumed_at')
                  ->orWhere('expires_at', '<', now()->subDay());
        })
        ->delete();

    if ($deleted > 0) {
        \Log::info("Cleaned up {$deleted} expired/consumed OTP challenges");
    }
})->daily()->withoutOverlapping();
