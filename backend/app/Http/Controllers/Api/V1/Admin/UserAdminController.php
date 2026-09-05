<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\UserRole;
use App\Enums\VerificationType;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ModerationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserAdminController extends Controller
{
    use ApiResponse;

    public function __construct(protected ModerationService $moderation)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        $users = User::query()
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = $request->query('q');
                $q->where(fn ($w) => $w
                    ->where('name', 'like', "%{$term}%")
                    ->orWhere('username', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%"));
            })
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->query('role')))
            ->when($request->filled('status'), function ($q) use ($request) {
                match ($request->query('status')) {
                    'suspended' => $q->where('is_suspended', true),
                    'active' => $q->where('is_suspended', false),
                    default => null,
                };
            })
            ->withCount(['questions', 'answers'])
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated(
            $users->through(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role->value,
                'reputation' => $user->reputation,
                'questions_count' => $user->questions_count,
                'answers_count' => $user->answers_count,
                'is_suspended' => $user->is_suspended,
                'suspended_reason' => $user->suspended_reason,
                'email_verified' => $user->email_verified_at !== null,
                'verification' => $user->activeVerification()?->type,
                'created_at' => $user->created_at,
            ])
        );
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['user', 'moderator', 'admin'])],
        ]);

        $actor = $request->user();

        // Guard against removing the last administrator account.
        if ($user->isAdmin() && $data['role'] !== 'admin') {
            $adminCount = User::query()->where('role', UserRole::Admin->value)->where('is_suspended', false)->count();

            if ($adminCount <= 1) {
                return $this->error('Cannot demote the last administrator account.', 422);
            }
        }

        if ($user->id === $actor->id && $data['role'] !== 'admin') {
            return $this->error('You cannot demote your own account.', 422);
        }

        $user->forceFill(['role' => $data['role']])->save();

        $this->moderation->log($actor, 'role_change', $user, null, ['new_role' => $data['role']]);

        return $this->success(null, "Role updated to {$data['role']}.");
    }

    public function verify(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(array_column(VerificationType::cases(), 'value'))],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        // Revoke any previous active verification before adding the new one.
        $user->verifications()->whereNull('revoked_at')->update(['revoked_at' => now()]);

        $user->verifications()->create([
            'type' => $data['type'],
            'verified_by' => $request->user()->id,
            'note' => $data['note'] ?? null,
            'created_at' => now(),
        ]);

        $this->moderation->log($request->user(), 'verify', $user, null, ['type' => $data['type']]);

        return $this->success(null, 'User verified.');
    }

    public function revokeVerification(Request $request, User $user): JsonResponse
    {
        $user->verifications()->whereNull('revoked_at')->update(['revoked_at' => now()]);

        $this->moderation->log($request->user(), 'revoke_verification', $user);

        return $this->success(null, 'Verification revoked.');
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        if ($user->id === $request->user()->id) {
            return $this->error('You cannot suspend your own account.', 422);
        }

        if ($user->isAdmin() && ! $request->user()->isAdmin()) {
            return $this->error('Only administrators can suspend an administrator.', 403);
        }

        $this->moderation->suspend($user, $request->user(), $data['reason']);

        return $this->success(null, 'User suspended.');
    }

    public function unsuspend(Request $request, User $user): JsonResponse
    {
        $this->moderation->unsuspend($user, $request->user());

        return $this->success(null, 'User restored.');
    }
}
