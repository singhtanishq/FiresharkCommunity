<?php

namespace App\Services;

use App\Enums\QuestionStatus;
use App\Models\Answer;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Every significant moderation action is written to the moderation_actions
 * audit trail with the acting moderator attached. Counter adjustments are
 * always clamped at zero so factory/legacy data cannot underflow.
 */
class ModerationService
{
    public function __construct(
        protected ReputationService $reputation,
        protected VoteService $voteService,
        protected NotificationService $notifications,
    ) {
    }

    public function log(User $moderator, string $action, Model $subject, ?string $reason = null, array $metadata = []): void
    {
        \App\Models\ModerationAction::create([
            'moderator_id' => $moderator->id,
            'action' => $action,
            'subject_type' => $subject->getMorphClass(),
            'subject_id' => $subject->getKey(),
            'reason' => $reason,
            'metadata' => $metadata ?: null,
            'created_at' => now(),
        ]);
    }

    public function hide(Model $content, User $moderator, ?string $reason = null): void
    {
        DB::transaction(function () use ($content, $moderator, $reason) {
            $wasPublic = $this->isPubliclyCounted($content);

            $content->forceFill(['status' => 'hidden'])->saveQuietly();

            if ($content instanceof Question) {
                if ($wasPublic) {
                    $this->bumpCategoryCount($content, -1);
                    $this->bumpUserCount($content, 'questions_count', -1);
                }
            }

            $this->log($moderator, 'hide', $content, $reason);
        });
    }

    public function restore(Model $content, User $moderator, ?string $reason = null): void
    {
        DB::transaction(function () use ($content, $moderator, $reason) {
            $wasPublic = $this->isPubliclyCounted($content);

            if ($content instanceof Question) {
                $status = $content->isClosed() ? QuestionStatus::Closed->value : QuestionStatus::Published->value;
                $content->forceFill(['status' => $status])->saveQuietly();

                if (! $wasPublic) {
                    $this->bumpCategoryCount($content, 1);
                    $this->bumpUserCount($content, 'questions_count', 1);
                }
            } else {
                $content->forceFill(['status' => 'published'])->saveQuietly();
            }

            $this->log($moderator, 'restore', $content, $reason);
        });
    }

    public function close(Question $question, User $moderator, string $reason): void
    {
        $question->forceFill([
            'status' => QuestionStatus::Closed->value,
            'closed_reason' => $reason,
            'closed_at' => now(),
        ])->saveQuietly();

        $this->log($moderator, 'close', $question, $reason);
    }

    public function reopen(Question $question, User $moderator, ?string $reason = null): void
    {
        $question->forceFill([
            'status' => QuestionStatus::Published->value,
            'closed_reason' => null,
            'closed_at' => null,
        ])->saveQuietly();

        $this->log($moderator, 'reopen', $question, $reason);
    }

    /**
     * Soft-delete content, roll back the reputation its author earned from
     * it, and remove its votes. Also cleans up attached comments.
     */
    public function delete(Model $content, User $moderator, ?string $reason = null): void
    {
        DB::transaction(function () use ($content, $moderator, $reason) {
            $wasPublic = $this->isPubliclyCounted($content);

            if ($content instanceof Question) {
                // Unaccept first so the accepted-answer reputation rollback
                // flows through the same ledger as every other event.
                if ($content->accepted_answer_id) {
                    $content->acceptedAnswer->forceFill(['accepted_at' => null])->saveQuietly();
                    User::query()->whereKey($content->acceptedAnswer->user_id)->decrement('accepted_answers_count');
                    $this->reputation->revokeForSource($content->acceptedAnswer->user, 'answer_accepted', $content->acceptedAnswer);
                }

                foreach ($content->answers()->withTrashed()->get() as $answer) {
                    $this->deleteAnswerInternals($answer);
                }
            } elseif ($content instanceof Answer) {
                if ($wasPublic) {
                    $this->bumpQuestionCount($content, 'answers_count', -1);
                }

                if ($content->accepted_at) {
                    $content->question->forceFill(['accepted_answer_id' => null, 'is_solved' => false])->saveQuietly();
                    User::query()->whereKey($content->user_id)->decrement('accepted_answers_count');
                    $this->reputation->revokeForSource($content->user, 'answer_accepted', $content);
                }

                $this->deleteAnswerInternals($content);
            }

            $this->reputation->revokeAllForSource($content);
            $this->voteService->deleteVotesFor($content);
            $content->comments()->delete();

            if ($content instanceof Question && $wasPublic) {
                $this->bumpCategoryCount($content, -1);
                $this->bumpUserCount($content, 'questions_count', -1);
            }

            $content->delete();

            $this->log($moderator, 'delete', $content, $reason);
        });
    }

    public function warn(User $user, User $moderator, string $message): void
    {
        $this->notifications->send($user, 'moderation_action', $message, '/community-guidelines', null);

        $this->log($moderator, 'warn', $user, $message);
    }

    public function suspend(User $user, User $moderator, string $reason): void
    {
        $user->forceFill([
            'is_suspended' => true,
            'suspended_reason' => $reason,
        ])->saveQuietly();

        $this->log($moderator, 'suspend', $user, $reason);
    }

    public function unsuspend(User $user, User $moderator, ?string $reason = null): void
    {
        $user->forceFill([
            'is_suspended' => false,
            'suspended_reason' => null,
        ])->saveQuietly();

        $this->log($moderator, 'unsuspend', $user, $reason);
    }

    public function penalize(User $user, User $moderator, int $points, string $reason): void
    {
        if ($points <= 0) {
            $points = abs((int) (\App\Models\ReputationRule::query()->where('action', 'moderation_violation')->value('points') ?? -50));
        }

        // Recorded as a direct negative transaction on the ledger.
        DB::transaction(function () use ($user, $moderator, $points, $reason) {
            \App\Models\ReputationTransaction::create([
                'user_id' => $user->id,
                'action' => 'moderation_violation',
                'points' => -$points,
                'created_at' => now(),
            ]);

            $user->decrement('reputation', $points);
        });

        $this->log($moderator, 'penalize', $user, $reason, ['points' => -$points]);
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    protected function deleteAnswerInternals(Answer $answer): void
    {
        $this->reputation->revokeAllForSource($answer);
        $this->voteService->deleteVotesFor($answer);
        $answer->comments()->delete();

        if (! $answer->trashed()) {
            $answer->delete();
        }
    }

    protected function isPubliclyCounted(Model $content): bool
    {
        if ($content instanceof Question) {
            $status = QuestionStatus::tryFrom((string) $content->getRawOriginal('status'))
                ?? $content->status;

            return $status !== null && $status->isPubliclyVisible() && ! $content->trashed();
        }

        if ($content instanceof Answer) {
            return $content->getRawOriginal('status') === 'published' && ! $content->trashed();
        }

        return false;
    }

    protected function bumpCategoryCount(Question $question, int $delta): void
    {
        DB::table('categories')
            ->where('id', $question->category_id)
            ->update(['questions_count' => DB::raw("GREATEST(CAST(questions_count AS SIGNED) + ({$delta}), 0)")]);
    }

    protected function bumpUserCount(Question $question, string $column, int $delta): void
    {
        DB::table('users')
            ->where('id', $question->user_id)
            ->update([$column => DB::raw("GREATEST(CAST({$column} AS SIGNED) + ({$delta}), 0)")]);
    }

    protected function bumpQuestionCount(Answer $answer, string $column, int $delta): void
    {
        DB::table('questions')
            ->where('id', $answer->question_id)
            ->update([$column => DB::raw("GREATEST(CAST({$column} AS SIGNED) + ({$delta}), 0)")]);
    }
}
