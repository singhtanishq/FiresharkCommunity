<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Tracks and locks out failed password attempts. Designed to protect against
 * distributed brute-force attacks: we lock by *account* (not just IP) but
 * with conservative thresholds and an automatic release window so a single
 * attacker cannot permanently lock out a legitimate user.
 */
class AccountSecurityService
{
    public const MAX_ATTEMPTS = 5;
    public const WINDOW_SECONDS = 10 * 60; // 10 minutes
    public const LOCK_SECONDS = 15 * 60;  // 15 minutes
    public const PER_IP_TRIES_PER_HOUR = 25;

    public function recordFailedPassword(User $user, ?string $ip): void
    {
        $user->forceFill([
            'failed_login_attempts' => $user->failed_login_attempts + 1,
            'last_failed_login_at' => now(),
        ])->save();

        if ($ip) {
            Cache::increment("login:ip:{$ip}:".now()->format('YmdH'), 1);
            Cache::put("login:ip:{$ip}:".now()->format('YmdH'), Cache::get("login:ip:{$ip}:".now()->format('YmdH'), 1), now()->addHour());
        }

        // Lock the account when the rolling window of failed attempts for
        // this exact user reaches the threshold. The check uses the just-
        // incremented value to handle the first failure too.
        if ($user->failed_login_attempts >= self::MAX_ATTEMPTS) {
            $user->forceFill(['locked_until' => now()->addSeconds(self::LOCK_SECONDS)])->save();
        }
    }

    public function recordSuccessfulLogin(User $user): void
    {
        $user->forceFill([
            'failed_login_attempts' => 0,
            'last_failed_login_at' => null,
            'locked_until' => null,
        ])->save();
    }

    public function isLocked(User $user): bool
    {
        return $user->locked_until !== null && $user->locked_until->isFuture();
    }

    public function remainingLockSeconds(User $user): int
    {
        if (! $this->isLocked($user)) {
            return 0;
        }

        return max(1, (int) ceil($user->locked_until->diffInSeconds(now())));
    }

    public function ipAllowed(?string $ip): bool
    {
        if (! $ip) {
            return true;
        }

        $count = (int) Cache::get("login:ip:{$ip}:".now()->format('YmdH'), 0);

        return $count < self::PER_IP_TRIES_PER_HOUR;
    }
}
