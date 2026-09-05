<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class VoteService
{
    public function __construct(
        protected ReputationService $reputation,
        protected NotificationService $notifications,
        protected BadgeService $badges,
    ) {
    }

    /**
     * Cast, change or (by toggling) withdraw a vote. Returns the resulting
     * vote value currently held by the user: 1, -1 or 0 (no vote).
     */
    public function vote(User $user, Model $votable, int $value): int
    {
        if (! in_array($value, [1, -1], true)) {
            throw new InvalidArgumentException('Vote value must be 1 or -1.');
        }

        if ($votable->user_id === $user->id) {
            throw new InvalidArgumentException('You cannot vote on your own content.');
        }

        [$actionUp, $actionDown] = $votable instanceof Question
            ? ['question_upvoted', 'question_downvoted']
            : ['answer_upvoted', 'answer_downvoted'];

        return DB::transaction(function () use ($user, $votable, $value, $actionUp, $actionDown) {
            /** @var Vote|null $existing */
            $existing = Vote::query()
                ->where('user_id', $user->id)
                ->where('votable_type', $votable->getMorphClass())
                ->where('votable_id', $votable->getKey())
                ->lockForUpdate()
                ->first();

            // Re-lock the votable row so concurrent votes cannot desync the score.
            $votable = $votable->lockForUpdate()->find($votable->getKey());
            $author = $votable->user()->lockForUpdate()->first();

            $authorAction = null;
            $revokeAction = null;

            if ($existing && $existing->value === $value) {
                // Toggle off.
                $existing->delete();
                $votable->decrement('votes_score', $value);
                $this->reputation->revokeForSource($author, $value === 1 ? $actionUp : $actionDown, $votable);
                $current = 0;
            } else {
                if ($existing) {
                    // Flip direction: undo old reputation, apply the new one.
                    $votable->decrement('votes_score', $existing->value);
                    $this->reputation->revokeForSource($author, $existing->value === 1 ? $actionUp : $actionDown, $votable);
                    $existing->update(['value' => $value]);
                } else {
                    Vote::create([
                        'user_id' => $user->id,
                        'votable_type' => $votable->getMorphClass(),
                        'votable_id' => $votable->getKey(),
                        'value' => $value,
                    ]);
                }

                $votable->increment('votes_score', $value);
                $this->reputation->award($author, $value === 1 ? $actionUp : $actionDown, $votable);

                if ($value === 1) {
                    $title = $votable instanceof Question ? $votable->title : null;
                    $this->notifications->send(
                        $author,
                        $votable instanceof Question ? 'question_upvoted' : 'answer_upvoted',
                        $title ? "Your question \"{$title}\" received an upvote." : 'Your answer received an upvote.',
                        $votable instanceof Question ? "/questions/{$votable->slug}" : "/questions/{$votable->question->slug}",
                        $user
                    );
                    $this->badges->evaluate($author);
                }

                $current = $value;
            }

            return $current;
        });
    }

    /**
     * Recompute a votable's score from its votes (repair helper).
     */
    public function resyncScore(Model $votable): int
    {
        $score = (int) $votable->votes()->sum('value');
        $votable->forceFill(['votes_score' => $score])->saveQuietly();

        return $score;
    }

    public function deleteVotesFor(Model $votable): void
    {
        Vote::query()
            ->where('votable_type', $votable->getMorphClass())
            ->where('votable_id', $votable->getKey())
            ->delete();
    }
}
