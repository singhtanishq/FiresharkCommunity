<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\User;
use App\Models\UserBadge;
use Illuminate\Support\Facades\Log;

/**
 * Evaluates automatic badges after relevant user activity and awards any
 * newly-earned badge exactly once. Manual badges (instructor, professional)
 * are granted by administrators and are not evaluated here.
 */
class BadgeService
{
    public function __construct(protected NotificationService $notifications)
    {
    }

    public function evaluate(User $user): void
    {
        $earned = $user->badges()->pluck('badges.id')->all();

        Badge::query()
            ->where('award_type', 'automatic')
            ->where('is_active', true)
            ->whereNotIn('id', $earned ?: [0])
            ->get()
            ->each(function (Badge $badge) use ($user) {
                if ($this->meetsCriteria($user, $badge)) {
                    $this->grant($user, $badge);
                }
            });
    }

    public function grant(User $user, Badge $badge, ?User $grantedBy = null): bool
    {
        $exists = UserBadge::query()
            ->where('user_id', $user->id)
            ->where('badge_id', $badge->id)
            ->exists();

        if ($exists) {
            return false;
        }

        UserBadge::create([
            'user_id' => $user->id,
            'badge_id' => $badge->id,
            'awarded_by' => $grantedBy?->id,
            'created_at' => now(),
        ]);

        $this->notifications->send(
            $user,
            'badge_earned',
            "You earned the \"{$badge->name}\" badge!",
            "/users/{$user->username}",
            null
        );

        Log::info('Badge awarded', ['user_id' => $user->id, 'badge' => $badge->slug]);

        return true;
    }

    protected function meetsCriteria(User $user, Badge $badge): bool
    {
        $criteria = $badge->criteria ?? [];
        $type = $criteria['type'] ?? null;
        $threshold = (int) ($criteria['count'] ?? 0);

        if (! $type || $threshold <= 0) {
            return false;
        }

        return match ($type) {
            'questions_count' => $user->questions_count >= $threshold,
            'answers_count' => $user->answers_count >= $threshold,
            'accepted_answers' => $user->accepted_answers_count >= $threshold,
            'reputation' => $user->reputation >= $threshold,
            'upvotes_received' => $this->upvotesReceived($user) >= $threshold,
            default => false,
        };
    }

    protected function upvotesReceived(User $user): int
    {
        // Fresh aggregate; cached counters on the user would drift after
        // vote removals, so this stays exact and cheap on indexed columns.
        $questionUp = $user->questions()
            ->where('status', 'published')
            ->join('votes', function ($join) {
                $join->on('votes.votable_id', '=', 'questions.id')
                    ->where('votes.votable_type', 'question')
                    ->where('votes.value', 1);
            })
            ->count();

        $answerUp = $user->answers()
            ->join('votes', function ($join) {
                $join->on('votes.votable_id', '=', 'answers.id')
                    ->where('votes.votable_type', 'answer')
                    ->where('votes.value', 1);
            })
            ->count();

        return $questionUp + $answerUp;
    }
}
