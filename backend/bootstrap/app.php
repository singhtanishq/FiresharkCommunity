<?php

use App\Http\Middleware\EnsureEmailVerifiedForApi;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // SPA cookie authentication: API requests from the first-party
        // frontend share the session so Sanctum's CSRF/session flow works.
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
            SecurityHeaders::class,
        ]);

        $middleware->web(append: [
            SecurityHeaders::class,
        ]);

        $middleware->alias([
            'role' => EnsureRole::class,
            'verified.api' => EnsureEmailVerifiedForApi::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Consistent API error envelope across every controller.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors' => $e->errors(),
                ], 422);
            }

            $status = match (true) {
                $e instanceof \Illuminate\Auth\AuthenticationException => 401,
                $e instanceof \Illuminate\Auth\Access\AuthorizationException => 403,
                $e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException => 429,
                $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException,
                $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 404,
                default => null,
            };

            if ($status !== null) {
                return response()->json([
                    'success' => false,
                    'message' => match ($status) {
                        401 => 'Authentication required.',
                        403 => $e->getMessage() ?: 'You do not have permission to perform this action.',
                        404 => 'Resource not found.',
                        429 => 'Too many requests. Please slow down.',
                        default => $e->getMessage(),
                    },
                ], $status);
            }

            return null; // Fall through to the framework's default handler.
        });
    })
    ->create();
