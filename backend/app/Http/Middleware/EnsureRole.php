<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('role:admin') or ->middleware('role:moderator,admin')
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $allowed = array_filter(
            array_map(fn (string $role) => UserRole::tryFrom($role), $roles),
        );

        if (! in_array($user->role, $allowed, true)) {
            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}
