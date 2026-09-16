<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Global email budget / circuit breaker to prevent ZeptoMail quota exhaustion.
 *
 * Tracks outbound authentication emails across multiple dimensions:
 * - Global hourly/daily limits (hard stops)
 * - Per-endpoint limits
 * - Per-IP limits
 * - Per-email limits
 *
 * Uses Redis for atomic counters with sliding window expiration.
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
        $hourKey = "email:budget:hourly:{$now->format('YmdH')}";
        $dayKey = "email:budget:daily:{$now->format('Ymd')}";
        $endpointKey = "email:budget:endpoint:{$endpoint}:{$now->format('YmdH')}";
        $ipKey = "email:budget:ip:{$ip}:{$now->format('YmdH')}";
        $emailKey = "email:budget:email:{$identifier}:{$now->format('YmdH')}";

        // Use Redis store for atomic operations
        $redis = Cache::store('redis');

        // Atomic increment with automatic expiration
        $hourly = $redis->increment($hourKey);
        if ($hourly === 1) {
            $redis->expire($hourKey, 3600); // 1 hour TTL
        }

        $daily = $redis->increment($dayKey);
        if ($daily === 1) {
            $redis->expire($dayKey, 86400); // 24 hour TTL
        }

        $endpointCount = $redis->increment($endpointKey);
        if ($endpointCount === 1) {
            $redis->expire($endpointKey, 3600);
        }

        $ipCount = $redis->increment($ipKey);
        if ($ipCount === 1) {
            $redis->expire($ipKey, 3600);
        }

        $emailCount = $redis->increment($emailKey);
        if ($emailCount === 1) {
            $redis->expire($emailKey, 3600);
        }

        // Check limits in order of strictness
        $this->checkGlobalLimits($hourly, $daily, $endpoint, $identifier, $ip);
        $this->checkEndpointLimit($endpoint, $endpointCount, $identifier, $ip);
        $this->checkIpLimit($ip, $ipCount, $endpoint, $identifier);
        $this->checkEmailLimit($identifier, $emailCount, $endpoint, $ip);

        // Fire alerts at thresholds (non-blocking)
        $this->maybeAlertThresholds($hourly, $daily, $endpoint, $ipCount, $emailCount);

        return true;
    }

    /**
     * Check global hourly/daily limits.
     */
    protected function checkGlobalLimits(int $hourly, int $daily, string $endpoint, string $identifier, string $ip): void
    {
        if ($hourly > self::GLOBAL_HOURLY_LIMIT) {
            $this->decrementCounters($hourly, $daily);
            $this->alert('GLOBAL_HOURLY_EXCEEDED', [
                'hourly_count' => $hourly,
                'limit' => self::GLOBAL_HOURLY_LIMIT,
                'endpoint' => $endpoint,
                'ip' => $ip,
                'email' => $identifier,
            ]);
            throw new RuntimeException('Global hourly email budget exceeded. Please try again later.');
        }

        if ($daily > self::GLOBAL_DAILY_LIMIT) {
            $this->decrementCounters($hourly, $daily);
            $this->alert('GLOBAL_DAILY_EXCEEDED', [
                'daily_count' => $daily,
                'limit' => self::GLOBAL_DAILY_LIMIT,
                'endpoint' => $endpoint,
                'ip' => $ip,
                'email' => $identifier,
            ]);
            throw new RuntimeException('Daily email budget exceeded. Please try again tomorrow.');
        }
    }

    /**
     * Check per-endpoint limit.
     */
    protected function checkEndpointLimit(string $endpoint, int $count, string $identifier, string $ip): void
    {
        $limit = self::ENDPOINT_LIMITS[$endpoint] ?? self::GLOBAL_HOURLY_LIMIT;

        if ($count > $limit) {
            $this->alert('ENDPOINT_LIMIT_EXCEEDED', [
                'endpoint' => $endpoint,
                'count' => $count,
                'limit' => $limit,
                'ip' => $ip,
                'email' => $identifier,
            ]);
            throw new RuntimeException("Too many {$endpoint} emails sent. Please slow down.");
        }
    }

    /**
     * Check per-IP limit.
     */
    protected function checkIpLimit(string $ip, int $count, string $endpoint, string $identifier): void
    {
        if ($count > self::PER_IP_HOURLY_LIMIT) {
            $this->alert('IP_LIMIT_EXCEEDED', [
                'ip' => $ip,
                'count' => $count,
                'limit' => self::PER_IP_HOURLY_LIMIT,
                'endpoint' => $endpoint,
                'email' => $identifier,
            ]);
            throw new RuntimeException('Too many requests from this IP. Please try again later.');
        }
    }

    /**
     * Check per-email limit.
     */
    protected function checkEmailLimit(string $identifier, int $count, string $endpoint, string $ip): void
    {
        if ($count > self::PER_EMAIL_HOURLY_LIMIT) {
            $this->alert('EMAIL_LIMIT_EXCEEDED', [
                'email' => $identifier,
                'count' => $count,
                'limit' => self::PER_EMAIL_HOURLY_LIMIT,
                'endpoint' => $endpoint,
                'ip' => $ip,
            ]);
            throw new RuntimeException('Too many emails sent to this address. Please try again later.');
        }
    }

    /**
     * Fire alerts when thresholds are crossed (non-blocking).
     */
    protected function maybeAlertThresholds(int $hourly, int $daily, string $endpoint, int $ipCount, int $emailCount): void
    {
        // Global hourly threshold
        if ($hourly === self::ALERT_THRESHOLD_HOURLY) {
            $this->alert('GLOBAL_HOURLY_WARNING', [
                'count' => $hourly,
                'limit' => self::GLOBAL_HOURLY_LIMIT,
                'percentage' => round(($hourly / self::GLOBAL_HOURLY_LIMIT) * 100),
            ]);
        }

        // Global daily threshold
        if ($daily === self::ALERT_THRESHOLD_DAILY) {
            $this->alert('GLOBAL_DAILY_WARNING', [
                'count' => $daily,
                'limit' => self::GLOBAL_DAILY_LIMIT,
                'percentage' => round(($daily / self::GLOBAL_DAILY_LIMIT) * 100),
            ]);
        }

        // Endpoint-specific warning at 80%
        $endpointLimit = self::ENDPOINT_LIMITS[$endpoint] ?? self::GLOBAL_HOURLY_LIMIT;
        if ($ipCount > 0 && $ipCount === (int)($endpointLimit * 0.8)) {
            $this->alert('ENDPOINT_WARNING', [
                'endpoint' => $endpoint,
                'count' => $ipCount,
                'limit' => $endpointLimit,
            ]);
        }
    }

    /**
     * Decrement counters when rejecting a request (compensate for pre-increment).
     */
    protected function decrementCounters(int $hourly, int $daily): void
    {
        $now = now();
        $redis = Cache::store('redis');
        $redis->decrement("email:budget:hourly:{$now->format('YmdH')}");
        $redis->decrement("email:budget:daily:{$now->format('Ymd')}");
    }

    /**
     * Log alert and send to monitoring channels.
     */
    protected function alert(string $type, array $context): void
    {
        Log::warning("Email budget alert: {$type}", $context);

        // TODO: Integrate with monitoring (Slack, PagerDuty, etc.)
        // Example:
        // if (config('services.slack.webhook_url')) {
        //     Http::post(config('services.slack.webhook_url'), [
        //         'text' => "🚨 Email Budget Alert: {$type}",
        //         'blocks' => [...]
        //     ]);
        // }
    }

    /**
     * Get current budget statistics for monitoring/dashboard.
     */
    public function getStats(): array
    {
        $now = now();
        $redis = Cache::store('redis');

        return [
            'global' => [
                'hourly' => (int) $redis->get("email:budget:hourly:{$now->format('YmdH')}", 0),
                'daily' => (int) $redis->get("email:budget:daily:{$now->format('Ymd')}", 0),
                'hourly_limit' => self::GLOBAL_HOURLY_LIMIT,
                'daily_limit' => self::GLOBAL_DAILY_LIMIT,
            ],
            'endpoints' => array_map(function ($limit, $endpoint) use ($redis, $now) {
                return [
                    'limit' => $limit,
                    'current' => (int) $redis->get("email:budget:endpoint:{$endpoint}:{$now->format('YmdH')}", 0),
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