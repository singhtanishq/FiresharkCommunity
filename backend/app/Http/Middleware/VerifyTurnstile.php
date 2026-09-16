<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verify Cloudflare Turnstile CAPTCHA token server-side.
 *
 * This middleware MUST be applied to all email-generating endpoints.
 * It fails closed - if verification fails or service is unavailable,
 * the request is rejected.
 */
class VerifyTurnstile
{
    public function handle(Request $request, Closure $next): Response
    {
        // Skip in local development if explicitly configured
        if (app()->environment('local') && ! config('services.turnstile.enforce_in_local', false)) {
            return $next($request);
        }

        // Extract Turnstile token from various possible locations
        $token = $this->extractToken($request);

        if (! $token) {
            return $this->failedResponse('Turnstile token is required.', 'missing_token');
        }

        $secret = config('services.turnstile.secret_key');

        if (! $secret) {
            Log::error('Turnstile secret key not configured in services.turnstile.secret_key');
            return $this->failedResponse('Security verification misconfigured.', 'server_error', 500);
        }

        try {
            $response = Http::timeout(5)
                ->asForm()
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);

            if (! $response->successful()) {
                Log::warning('Turnstile API returned non-2xx response', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'ip' => $request->ip(),
                ]);
                return $this->failedResponse('Security verification service unavailable. Please try again later.', 'service_unavailable', 503);
            }

            $result = $response->json();

            if (! ($result['success'] ?? false)) {
                $errorCodes = $result['error-codes'] ?? ['unknown'];
                Log::warning('Turnstile verification failed', [
                    'error_codes' => $errorCodes,
                    'ip' => $request->ip(),
                    'hostname' => $result['hostname'] ?? null,
                    'action' => $result['action'] ?? null,
                ]);

                // Provide specific error messages for common failure reasons
                $message = match (true) {
                    in_array('timeout-or-duplicate', $errorCodes) => 'CAPTCHA token has expired or was already used. Please complete a new challenge.',
                    in_array('invalid-input-response', $errorCodes) => 'Invalid CAPTCHA response. Please try again.',
                    in_array('invalid-input-secret', $errorCodes) => 'Server configuration error. Please contact support.',
                    default => 'CAPTCHA verification failed. Please try again.',
                };

                return $this->failedResponse($message, 'verification_failed', 422, $errorCodes);
            }

            // Optional: Verify the action matches expected (if using action parameter)
            // $expectedAction = $request->route()->getAction('turnstile_action') ?? null;
            // if ($expectedAction && ($result['action'] ?? '') !== $expectedAction) {
            //     return $this->failedResponse('Invalid CAPTCHA action.', 'action_mismatch');
            // }

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Turnstile connection failed', ['error' => $e->getMessage(), 'ip' => $request->ip()]);
            return $this->failedResponse('Security verification service unavailable. Please try again later.', 'connection_failed', 503);
        } catch (\Exception $e) {
            Log::error('Turnstile verification error', ['error' => $e->getMessage(), 'ip' => $request->ip()]);
            return $this->failedResponse('Security verification error. Please try again later.', 'server_error', 500);
        }

        return $next($request);
    }

    /**
     * Extract Turnstile token from request.
     * Supports header, form input, and JSON body.
     */
    protected function extractToken(Request $request): ?string
    {
        // Header (preferred for API)
        if ($token = $request->header('CF-Turnstile-Response')) {
            return $token;
        }

        if ($token = $request->header('X-Turnstile-Token')) {
            return $token;
        }

        // Form/input
        if ($token = $request->input('cf-turnstile-response')) {
            return $token;
        }

        if ($token = $request->input('turnstile_token')) {
            return $token;
        }

        // JSON body
        if ($request->isJson()) {
            if ($token = $request->json('cf-turnstile-response')) {
                return $token;
            }
            if ($token = $request->json('turnstile_token')) {
                return $token;
            }
        }

        return null;
    }

    /**
     * Generate standardized error response.
     */
    protected function failedResponse(string $message, string $errorCode, int $status = 422, array $details = []): Response
    {
        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => $errorCode,
        ];

        if (! empty($details)) {
            $response['details'] = $details;
        }

        return response()->json($response, $status);
    }
}