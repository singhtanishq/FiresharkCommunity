<?php

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
