<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Trust Cloudflare proxy headers only when the request actually comes from Cloudflare IPs.
 * This prevents IP spoofing via X-Forwarded-For / CF-Connecting-IP headers.
 *
 * Cloudflare IP ranges are fetched from https://www.cloudflare.com/ips-v4 and https://www.cloudflare.com/ips-v6
 * and should be updated periodically.
 */
class TrustCloudflareProxies
{
    /**
     * Cloudflare IPv4 and IPv6 ranges (as of 2024).
     * These should be kept in sync with Cloudflare's published ranges.
     * Consider using a scheduled job to fetch and cache them automatically.
     */
    protected array $cloudflareRanges = [
        // IPv4
        '173.245.48.0/20',
        '103.21.244.0/22',
        '103.22.200.0/22',
        '103.31.4.0/22',
        '141.101.64.0/18',
        '108.162.192.0/18',
        '190.93.240.0/20',
        '188.114.96.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
        '162.158.0.0/15',
        '104.16.0.0/13',
        '104.24.0.0/14',
        '172.64.0.0/13',
        '131.0.72.0/22',
        // IPv6
        '2400:cb00::/32',
        '2606:4700::/32',
        '2803:f800::/32',
        '2405:b500::/32',
        '2405:8100::/32',
        '2a06:98c0::/29',
        '2c0f:f248::/32',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Get the actual client IP that connected to our server (Hostinger/Cloudflare edge)
        $directClientIp = $request->getClientIps()[0] ?? '';

        // Only trust Cloudflare headers if the request comes from a known Cloudflare IP
        if ($this->isCloudflareIp($directClientIp)) {
            // Prefer CF-Connecting-IP (set by Cloudflare, hardest to spoof)
            $cfConnectingIp = $request->header('CF-Connecting-IP');
            if ($cfConnectingIp && $this->isValidIp($cfConnectingIp)) {
                $request->server->set('REMOTE_ADDR', $cfConnectingIp);
            } else {
                // Fallback to X-Forwarded-For (take the first/leftmost IP)
                $forwardedFor = $request->header('X-Forwarded-For');
                if ($forwardedFor) {
                    $firstIp = trim(explode(',', $forwardedFor)[0]);
                    if ($this->isValidIp($firstIp)) {
                        $request->server->set('REMOTE_ADDR', $firstIp);
                    }
                }
            }
        }

        return $next($request);
    }

    /**
     * Check if an IP address falls within Cloudflare's published ranges.
     */
    protected function isCloudflareIp(string $ip): bool
    {
        if (! $this->isValidIp($ip)) {
            return false;
        }

        foreach ($this->cloudflareRanges as $range) {
            if ($this->ipInRange($ip, $range)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Validate IP address format (both IPv4 and IPv6).
     */
    protected function isValidIp(string $ip): bool
    {
        return filter_var($ip, FILTER_VALIDATE_IP) !== false;
    }

    /**
     * Check if an IP is within a CIDR range.
     * Supports both IPv4 and IPv6.
     * Returns false safely if address families don't match.
     */
    protected function ipInRange(string $ip, string $range): bool
    {
        if (strpos($range, '/') === false) {
            return $ip === $range;
        }

        [$rangeIp, $cidr] = explode('/', $range);
        $cidr = (int) $cidr;

        // Use PHP's native IP handling - inet_pton returns binary string
        // IPv4 = 4 bytes, IPv6 = 16 bytes
        $ipBin = @inet_pton($ip);
        $rangeBin = @inet_pton($rangeIp);

        // If either is invalid, or address families don't match, return false
        if ($ipBin === false || $rangeBin === false) {
            return false;
        }

        // Address families must match (both IPv4 or both IPv6)
        if (strlen($ipBin) !== strlen($rangeBin)) {
            return false;
        }

        $bits = strlen($ipBin) * 8; // 32 for IPv4, 128 for IPv6

        // Validate CIDR prefix length is valid for this address family
        if ($cidr < 0 || $cidr > $bits) {
            return false;
        }

        // Create mask using bit operations (no hex2bin needed)
        // For the network portion, we want 1s; for host portion, 0s
        $bytes = $bits / 8;
        $fullBytes = $cidr >> 3; // integer division by 8
        $remainingBits = $cidr & 7; // modulo 8

        $mask = '';
        for ($i = 0; $i < $bytes; $i++) {
            if ($i < $fullBytes) {
                $mask .= "\xFF";
            } elseif ($i === $fullBytes && $remainingBits > 0) {
                $mask .= chr(0xFF << (8 - $remainingBits));
            } else {
                $mask .= "\x00";
            }
        }

        // Apply mask and compare
        return ($ipBin & $mask) === ($rangeBin & $mask);
    }
}