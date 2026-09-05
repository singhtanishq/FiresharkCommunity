<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Comment;
use App\Models\Question;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CommentService
{
    public function __construct(
        protected NotificationService $notifications,
        protected MentionService $mentions,
    ) {
    }

    public function create(Model $commentable, User $author, string $body): Comment
    {
        /** @var Comment $comment */
        $comment = $commentable->comments()->create([
            'user_id' => $author->id,
            'body' => $body,
            'status' => 'published',
        ]);

        $isQuestion = $commentable instanceof Question;

        /** @var Question $question */
        $question = $isQuestion ? $commentable : $commentable->question;
        $owner = $isQuestion ? $commentable->user : $commentable->user;

        $this->notifications->send(
            $owner,
            $isQuestion ? 'comment_question' : 'comment_answer',
            "{$author->name} commented on " . ($isQuestion ? "your question \"{$question->title}\"." : "your answer on \"{$question->title}\"."),
            "/questions/{$question->slug}",
            $author
        );

        foreach ($this->mentions->mentionedUsers($body) as $mentioned) {
            $this->notifications->send(
                $mentioned,
                'mention',
                "{$author->name} mentioned you in a comment on \"{$question->title}\".",
                "/questions/{$question->slug}",
                $author
            );
        }

        return $comment;
    }
}
