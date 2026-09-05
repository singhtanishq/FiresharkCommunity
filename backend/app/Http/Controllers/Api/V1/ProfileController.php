<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\NotificationResource;
use App\Models\Bookmark;
use App\Models\Question;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    use ApiResponse;

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $data = collect($request->validated())->except('notification_preferences')->all();
        $user->fill($data);

        if ($request->has('notification_preferences')) {
            $prefs = array_map('boolval', $request->input('notification_preferences', []));
            $user->notification_preferences = array_merge($user->notification_preferences ?? [], $prefs);
        }

        $user->save();

        return $this->success(null, 'Profile updated.');
    }

    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
        ]);

        $user = $request->user();

        if ($user->avatar_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar_path);
        }

        $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');

        $user->update(['avatar_path' => $path]);

        return $this->success(['avatar_path' => attachment_url($path)], 'Avatar updated.');
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password:web'],
            'password' => ['required', 'string', Password::min(8), 'confirmed'],
        ]);

        $request->user()->update(['password' => $data['password']]);

        return $this->success(null, 'Password changed.');
    }

    public function bookmarks(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 15), 50);

        $questions = $request->user()->bookmarks()
            ->publiclyVisible()
            ->with(['category:id,name,slug', 'tags:id,name,slug', 'user:id,name,username,avatar_path'])
            ->orderBy('bookmarks.created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($questions, QuestionResource::class);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password:web'],
        ]);

        // Anonymise and deactivate instead of hard-deleting so community
        // content history stays intact. A support request finalises removal.
        $user = $request->user();

        $user->update([
            'name' => 'Deleted User',
            'bio' => null,
            'website' => null,
            'location' => null,
            'avatar_path' => null,
            'is_suspended' => true,
            'suspended_reason' => 'Account deactivated at owner request.',
        ]);
        $user->tokens()->delete();

        auth('web')->logout();

        return $this->success(null, 'Account deactivated. Contact support to complete permanent deletion.');
    }
}
