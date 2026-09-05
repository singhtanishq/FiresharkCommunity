<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\BadgeResource;
use App\Models\Badge;
use App\Models\ReputationRule;
use App\Models\User;
use App\Services\BadgeService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class GamificationAdminController extends Controller
{
    use ApiResponse;

    public function __construct(protected BadgeService $badges)
    {
    }

    /**
     * Public badge catalogue (no authentication required).
     */
    public function publicBadges(): JsonResponse
    {
        return $this->success(
            BadgeResource::collection(
                Badge::query()->where('is_active', true)->orderBy('sort_order')->get()
            )->resolve()
        );
    }

    // ------------------------------------------------------------------
    // Badges
    // ------------------------------------------------------------------

    public function badgesIndex(): JsonResponse
    {
        return $this->success(Badge::query()->orderBy('sort_order')->get()->map(fn ($badge) => [
            'id' => $badge->id,
            'name' => $badge->name,
            'slug' => $badge->slug,
            'description' => $badge->description,
            'icon' => $badge->icon,
            'tier' => $badge->tier,
            'award_type' => $badge->award_type,
            'criteria' => $badge->criteria,
            'is_active' => $badge->is_active,
            'awarded_count' => $badge->users()->count(),
        ])->all());
    }

    public function badgesStore(Request $request): JsonResponse
    {
        $data = $this->validateBadge($request);

        $badge = Badge::create($data + ['slug' => Str::slug($data['name'])]);

        return $this->success($badge, 'Badge created.', 201);
    }

    public function badgesUpdate(Request $request, Badge $badge): JsonResponse
    {
        $data = $this->validateBadge($request);

        if (isset($data['name']) && $data['name'] !== $badge->name) {
            $data['slug'] = Str::slug($data['name']);
        }

        $badge->update($data);

        return $this->success($badge, 'Badge updated.');
    }

    public function badgesDestroy(Badge $badge): JsonResponse
    {
        $badge->update(['is_active' => false]);

        return $this->success(null, 'Badge deactivated.');
    }

    public function award(Request $request, Badge $badge): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'exists:users,username'],
        ]);

        $user = User::query()->where('username', $data['username'])->firstOrFail();

        $granted = $this->badges->grant($user, $badge, $request->user());

        if (! $granted) {
            return $this->error('That user already has this badge.', 409);
        }

        return $this->success(null, "Badge awarded to {$user->name}.");
    }

    protected function validateBadge(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:50'],
            'tier' => ['required', Rule::in(['bronze', 'silver', 'gold'])],
            'award_type' => ['required', Rule::in(['automatic', 'manual'])],
            'criteria' => ['nullable', 'array'],
            'criteria.type' => ['nullable', Rule::in(['questions_count', 'answers_count', 'accepted_answers', 'reputation', 'upvotes_received'])],
            'criteria.count' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer'],
        ]);

        if ($data['award_type'] === 'automatic') {
            $data['criteria'] = [
                'type' => $data['criteria']['type'] ?? null,
                'count' => $data['criteria']['count'] ?? null,
            ];

            if (! $data['criteria']['type'] || ! $data['criteria']['count']) {
                abort(response()->json([
                    'success' => false,
                    'message' => 'Automatic badges require criteria (type and count).',
                    'errors' => ['criteria' => ['Automatic badges require criteria.']],
                ], 422));
            }
        }

        return $data;
    }

    // ------------------------------------------------------------------
    // Reputation rules
    // ------------------------------------------------------------------

    public function reputationRules(): JsonResponse
    {
        return $this->success(ReputationRule::query()->orderBy('action')->get()->map(fn ($rule) => [
            'id' => $rule->id,
            'action' => $rule->action,
            'label' => $rule->label,
            'points' => $rule->points,
            'is_enabled' => $rule->is_enabled,
        ])->all());
    }

    public function reputationRuleUpdate(Request $request, ReputationRule $rule): JsonResponse
    {
        $data = $request->validate([
            'points' => ['sometimes', 'integer', 'min:-500', 'max:500'],
            'is_enabled' => ['sometimes', 'boolean'],
        ]);

        $rule->update($data);

        return $this->success($rule, 'Reputation rule updated.');
    }
}
