<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserSummaryResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'username' => ['required', 'string', 'min:3', 'max:30', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'username' => strtolower($data['username']),
            'email' => $data['email'],
            'password' => $data['password'],
            'notification_preferences' => [
                'answers' => true,
                'comments' => true,
                'mentions' => true,
                'badges' => true,
                'moderation' => true,
            ],
        ]);

        if (! config('community.require_email_verification')) {
            $user->markEmailAsVerified();
        } else {
            event(new \Illuminate\Auth\Events\Registered($user));
        }

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return $this->success(
            new UserSummaryResource($user),
            'Welcome to the FireShark Community! Your account has been created.',
            201
        );
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // The identifier may be an email address or a username.
        $field = filter_var($credentials['email'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::query()->where($field, mb_strtolower($credentials['email']))->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        if ($user->is_suspended) {
            return $this->error(
                'Your account has been suspended. Contact support if you believe this is a mistake.',
                403
            );
        }

        Auth::guard('web')->login($user, $request->boolean('remember'));
        $request->session()->regenerate();
        $user->markActivity();

        return $this->success(new UserSummaryResource($user), 'Logged in successfully.');
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->success(null, 'Logged out successfully.');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->loadCount(['questions', 'answers', 'badges']);

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'email_verified' => $user->hasVerifiedEmail(),
            'avatar_path' => $user->avatar_path,
            'bio' => $user->bio,
            'expertise' => $user->expertise,
            'location' => $user->location,
            'website' => $user->website,
            'role' => $user->role->value,
            'reputation' => $user->reputation,
            'questions_count' => $user->questions_count,
            'answers_count' => $user->answers_count,
            'accepted_answers_count' => $user->accepted_answers_count,
            'badges_count' => $user->badges_count,
            'notification_preferences' => $user->notification_preferences,
            'created_at' => $user->created_at,
        ]);
    }
}
