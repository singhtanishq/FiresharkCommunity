<?php

namespace App\Services;

use App\Models\EmailBudgetCounter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Global email budget / circuit breaker using MySQL.
 *
 * Tracks outbound authentication emails across multiple dimensions:
 * - Global hourly/daily limits (hard stops)
 * - Per-endpoint limits
 * - Per-IP limits
 * - Per-email limits
 *
 * Uses MySQL table `email_budget_counters` with UNIQUE bucket_key.
 * Concurrency: INSERT ... ON DUPLICATE KEY UPDATE is atomic in InnoDB.
 * The UNIQUE constraint on bucket_key prevents duplicate rows even
 * under 100 concurrent requests.
 *
 * All limits are enforced BEFORE the email is sent to ZeptoMail.
 */
class EmailBudgetService
{
    // Hard limits - when exceeded, email is rejected
    public const GLOBAL_HOURLY_LIMIT = 500;
    public const GLOBAL_DAILY_LIMIT = 5000;

    // Alert thresholds - when reached, alerts are fired but email still allowed
    public const ALERT_THRESHOLD_HOURLY = 100;
    public const ALERT_THRESHOLD_DAILY = 1000;

    // Per-endpoint limits (hourly)
    protected const ENDPOINT_LIMITS = [
        'login_otp' => 200,
        'signup_otp' => 100,
        'password_reset_otp' => 150,
        'verification_resend' => 50,
    ];

    // Per-IP limit (hourly)
    protected const PER_IP_HOURLY_LIMIT = 50;

    // Per-email limit (hourly)
    protected const PER_EMAIL_HOURLY_LIMIT = 10;

    public function __construct()
    {
    }

    /**
     * Check and reserve a slot for an authentication email.
     * Returns true if allowed, throws RuntimeException if budget exhausted.
     *
     * @param string $endpoint Endpoint identifier: login_otp, signup_otp, password_reset_otp, verification_resend
     * @param string $identifier Email address or username
     * @param string $ip Client IP address
     * @return bool
     * @throws RuntimeException if any budget limit is exceeded
     */
    public function reserve(string $endpoint, string $identifier, string $ip): bool
    {
        $now = now();
        $hourWindowStart = $now->copy()->startOfHour();
        $dayWindowStart = $now->copy()->startOfDay();
        $hourWindowEnd = $now->copy()->startOfHour()->addHour();
        $dayWindowEnd = $now->copy()->startOfDay()->addDay();

        // Define all buckets to check
        $buckets = [
            // Global hourly
            [
                'bucket_key' => "email:budget:global:hourly:{$hourWindowStart->format('YmdHis')}",
                'bucket_type' => 'global',
                'scope_id' => 'global',
                'window_start' => $hourWindowStart,
                'window_end' => $hourWindowEnd,
                'limit' => self::GLOBAL_HOURLY_LIMIT,
                'limit_label' => 'global hourly',
            ],
            // Global daily
            [
                'bucket_key' => "email:budget:global:daily:{$dayWindowStart->format('YmdHis')}",
                'bucket_type' => 'global',
                'scope_id' => 'global',
                'window_start' => $dayWindowStart,
                'window_end' => $dayWindowEnd,
                'limit' => self::GLOBAL_DAILY_LIMIT,
                'limit_label' => 'global daily',
            ],
            // Per-endpoint hourly
            [
                'bucket_key' => "email:budget:endpoint:{$endpoint}:{$hourWindowStart->format('YmdHis')}",
                'bucket_type' => 'endpoint',
                'scope_id' => $endpoint,
                'window_start' => $hourWindowStart,
                'window_end' => $hourWindowEnd,
                'limit' => self::ENDPOINT_LIMITS[$endpoint] ?? self::GLOBAL_HOURLY_LIMIT,
                'limit_label' => "endpoint:{$endpoint}",
            ],
            // Per-IP hourly
            [
                'bucket_key' => "email:budget:ip:{$ip}:{$hourWindowStart->format('YmdHis')}",
                'bucket_type' => 'ip',
                'scope_id' => $ip,
                'window_start' => $hourWindowStart,
                'window_end' => $hourWindowEnd,
                'limit' => self::PER_IP_HOURLY_LIMIT,
                'limit_label' => "ip:{$ip}",
            ],
            // Per-email hourly
            [
                'bucket_key' => "email:budget:email:{$identifier}:{$hourWindowStart->format('YmdHis')}",
                'bucket_type' => 'email',
                'scope_id' => $identifier,
                'window_start' => $hourWindowStart,
                'window_end' => $hourWindowEnd,
                'limit' => self::PER_EMAIL_HOURLY_LIMIT,
                'limit_label' => "email:{$identifier}",
            ],
        ];

        DB::transaction(function () use ($buckets, $endpoint, $identifier, $ip) {
            foreach ($buckets as $bucket) {
                // Atomic increment: INSERT ... ON DUPLICATE KEY UPDATE
                // This is atomic in InnoDB - concurrent requests will be serialized
                // on the same bucket_key row due to the UNIQUE constraint.
                DB::statement("
                    INSERT INTO email_budget_counters (bucket_key, bucket_type, scope_id, `count`, window_start, window_end, created_at, updated_at)
                    VALUES (?, ?, ?, 1, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE `count` = `count` + 1, updated_at = ?
                ", [
                    $bucket['bucket_key'],
                    $bucket['bucket_type'],
                    $bucket['scope_id'],
                    $bucket['window_start'],
                    $bucket['window_end'],
                    now(),
                    now(),
                    now(),
                ]);

                // Read current count
                $row = DB::table('email_budget_counters')
                    ->where('bucket_key', $bucket['bucket_key'])
                    ->first();

                $currentCount = (int) ($row->count ?? 0);

                // Check limits
                if ($currentCount > $bucket['limit']) {
                    // Decrement back since we're rejecting
                    DB::statement("
                        UPDATE email_budget_counters SET `count` = `count` - 1, updated_at = ?
                        WHERE bucket_key = ?
                    ", [now(), $bucket['bucket_key']]);

                    $this->alert('BUDGET_EXCEEDED', [
                        'bucket_key' => $bucket['bucket_key'],
                        'bucket_type' => $bucket['bucket_type'],
                        'scope_id' => $bucket['scope_id'],
                        'current_count' => $currentCount,
                        'limit' => $bucket['limit'],
                        'limit_label' => $bucket['limit_label'],
                        'endpoint' => $endpoint,
                        'identifier' => $identifier,
                        'ip' => $ip,
                    ]);

                    throw new RuntimeException($this->getErrorMessage($bucket['limit_label'], $endpoint));
                }
            }
        });

        // Fire alert thresholds (outside transaction - non-blocking)
        $this->maybeAlertThresholds($now);

        return true;
    }

    /**
     * Get error message for exceeded limit.
     */
    protected function getErrorMessage(string $limitLabel, string $endpoint): string
    {
        return match ($limitLabel) {
            'global hourly' => 'Too many authentication emails sent this hour. Please try again later.',
            'global daily' => 'Daily email budget exceeded. Please try again tomorrow.',
            default => "Too many {$endpoint} emails sent. Please try again later.",
        };
    }

    /**
     * Fire alerts when thresholds are crossed (non-blocking).
     */
    protected function maybeAlertThresholds(\Carbon\Carbon $now): void
    {
        $hourStart = $now->copy()->startOfHour()->format('YmdHis');
        $dayStart = $now->copy()->startOfDay()->format('YmdHis');

        // Global hourly threshold
        $hourlyRow = DB::table('email_budget_counters')
            ->where('bucket_key', "email:budget:global:hourly:{$hourStart}")
            ->first();

        if ($hourlyRow && (int) $hourlyRow->count === self::ALERT_THRESHOLD_HOURLY) {
            $this->alert('GLOBAL_HOURLY_WARNING', [
                'count' => (int) $hourlyRow->count,
                'limit' => self::GLOBAL_HOURLY_LIMIT,
                'percentage' => round((self::ALERT_THRESHOLD_HOURLY / self::GLOBAL_HOURLY_LIMIT) * 100),
            ]);
        }

        // Global daily threshold
        $dailyRow = DB::table('email_budget_counters')
            ->where('bucket_key', "email:budget:global:daily:{$dayStart}")
            ->first();

        if ($dailyRow && (int) $dailyRow->count === self::ALERT_THRESHOLD_DAILY) {
            $this->alert('GLOBAL_DAILY_WARNING', [
                'count' => (int) $dailyRow->count,
                'limit' => self::GLOBAL_DAILY_LIMIT,
                'percentage' => round((self::ALERT_THRESHOLD_DAILY / self::GLOBAL_DAILY_LIMIT) * 100),
            ]);
        }
    }

    /**
     * Log alert and send to monitoring channels.
     */
    protected function alert(string $type, array $context): void
    {
        Log::warning("Email budget alert: {$type}", $context);

        // TODO: Integrate with monitoring (Slack, PagerDuty, etc.)
    }

    /**
     * Get current budget statistics for monitoring/dashboard.
     */
    public function getStats(): array
    {
        $now = now();
        $hourStart = $now->copy()->startOfHour()->format('YmdHis');
        $dayStart = $now->copy()->startOfDay()->format('YmdHis');

        $getCount = function (string $key): int {
            $row = DB::table('email_budget_counters')->where('bucket_key', $key)->first();
            return $row ? (int) $row->count : 0;
        };

        return [
            'global' => [
                'hourly' => $getCount("email:budget:global:hourly:{$hourStart}"),
                'daily' => $getCount("email:budget:global:daily:{$dayStart}"),
                'hourly_limit' => self::GLOBAL_HOURLY_LIMIT,
                'daily_limit' => self::GLOBAL_DAILY_LIMIT,
            ],
            'endpoints' => array_map(function ($limit, $endpoint) use ($now, $getCount) {
                $hourStart = $now->copy()->startOfHour()->format('YmdHis');
                return [
                    'limit' => $limit,
                    'current' => $getCount("email:budget:endpoint:{$endpoint}:{$hourStart}"),
                ];
            }, self::ENDPOINT_LIMITS, array_keys(self::ENDPOINT_LIMITS)),
            'per_ip_limit' => self::PER_IP_HOURLY_LIMIT,
            'per_email_limit' => self::PER_EMAIL_HOURLY_LIMIT,
        ];
    }

    /**
     * Determine endpoint type from purpose/subject.
     */
    public static function endpointFromPurpose(string $purpose): string
    {
        return match ($purpose) {
            'login' => 'login_otp',
            'signup_email' => 'signup_otp',
            'password_reset' => 'password_reset_otp',
            default => 'unknown',
        };
    }
}