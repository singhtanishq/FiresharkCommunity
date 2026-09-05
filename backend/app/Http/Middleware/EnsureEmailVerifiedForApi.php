<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Aborts with a JSON 403 when the account has not verified its email and
 * verification is required by configuration.
 */
class EnsureEmailVerifiedForApi
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('community.require_email_verification')) {
            return $next($request);
        }

        $user = $request->user();

        if (! $user || ! $user->hasVerifiedEmail()) {
            abort(response()->json([
                'success' => false,
                'message' => 'Please verify your email address before performing this action.',
                'errors' => ['email' => ['email_verification_required']],
            ], 403));
        }

        return $next($request);
    }
}
