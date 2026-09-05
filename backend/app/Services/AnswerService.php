<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AnswerService
{
    public function __construct(
        protected ReputationService $reputation,
        protected BadgeService $badges,
        protected MentionService $mentions,
        protected NotificationService $notifications,
    ) {
    }

    public function create(Question $question, User $author, string $body): Answer
    {
        return DB::transaction(function () use ($question, $author, $body) {
            /** @var Answer $answer */
            $answer = $question->answers()->create([
                'user_id' => $author->id,
                'body' => $body,
                'status' => 'published',
            ]);

            $question->increment('answers_count');
            $question->forceFill(['last_activity_at' => now()])->saveQuietly();

            $author->increment('answers_count');

            $this->reputation->award($author, 'answer_posted', $answer);
            $this->badges->evaluate($author);

            $question->loadMissing('user');

            // Notify the question author and everyone following the question.
            $recipients = $question->followers()->where('users.id', '!=', $author->id)->get();
            $recipients->push($question->user);

            foreach ($recipients->unique('id') as $recipient) {
                $isAuthor = $recipient->id === $question->user_id;
                $this->notifications->send(
                    $recipient,
                    $isAuthor ? 'question_answered' : 'question_activity',
                    "{$author->name} answered \"{$question->title}\".",
                    "/questions/{$question->slug}",
                    $author
                );
            }

            foreach ($this->mentions->mentionedUsers($body) as $mentioned) {
                $this->notifications->send(
                    $mentioned,
                    'mention',
                    "{$author->name} mentioned you in an answer on \"{$question->title}\".",
                    "/questions/{$question->slug}",
                    $author
                );
            }

            return $answer;
        });
    }

    /**
     * Accept an answer. Only the question author (or staff) may accept, and
     * only one answer can be accepted at a time.
     */
    public function accept(Question $question, Answer $answer, User $actor): void
    {
        DB::transaction(function () use ($question, $answer, $actor) {
            $previous = $question->acceptedAnswer()->lockForUpdate()->first();

            if ($previous && $previous->id === $answer->id) {
                return;
            }

            if ($previous) {
                $previous->forceFill(['accepted_at' => null])->saveQuietly();
                $previous->user->decrement('accepted_answers_count');
                $this->reputation->revokeForSource($previous->user, 'answer_accepted', $previous);
            }

            $answer->forceFill(['accepted_at' => now()])->saveQuietly();
            $question->forceFill([
                'accepted_answer_id' => $answer->id,
                'is_solved' => true,
                'last_activity_at' => now(),
            ])->saveQuietly();

            $answer->loadMissing('user');
            $answer->user->increment('accepted_answers_count');

            $this->reputation->award($answer->user, 'answer_accepted', $answer);
            $this->badges->evaluate($answer->user);

            $this->notifications->send(
                $answer->user,
                'answer_accepted',
                "Your answer on \"{$question->title}\" was accepted.",
                "/questions/{$question->slug}",
                $actor
            );
        });
    }

    public function unaccept(Question $question, User $actor): void
    {
        DB::transaction(function () use ($question, $actor) {
            $previous = $question->acceptedAnswer()->lockForUpdate()->first();

            if (! $previous) {
                return;
            }

            $previous->forceFill(['accepted_at' => null])->saveQuietly();
            $question->forceFill(['accepted_answer_id' => null, 'is_solved' => false])->saveQuietly();

            $previous->loadMissing('user');
            $previous->user->decrement('accepted_answers_count');
            $this->reputation->revokeForSource($previous->user, 'answer_accepted', $previous);
        });
    }
}
