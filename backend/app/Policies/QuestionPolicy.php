<?php

namespace App\Policies;

use App\Models\Question;
use App\Models\User;

class QuestionPolicy
{
    public function update(User $user, Question $question): bool
    {
        return $question->user_id === $user->id || $user->isStaff();
    }

    /**
     * Authors may delete their own question only while it has no answers;
     * everything else is a staff decision.
     */
    public function delete(User $user, Question $question): bool
    {
        if ($user->isStaff()) {
            return true;
        }

        return $question->user_id === $user->id && $question->answers_count === 0;
    }

    public function vote(User $user, Question $question): bool
    {
        return $question->user_id !== $user->id && ! $user->is_suspended;
    }

    /**
     * Accepting answers is the question author's call; staff may override.
     */
    public function acceptAnswer(User $user, Question $question): bool
    {
        return $question->user_id === $user->id || $user->isStaff();
    }

    /**
     * Answering your own question is allowed (documenting a solution is
     * valuable to the community); only self-voting is restricted.
     */
    public function answer(User $user, Question $question): bool
    {
        return ! $question->isClosed() && ! $user->is_suspended;
    }
}
