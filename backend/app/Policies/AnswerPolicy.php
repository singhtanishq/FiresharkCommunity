<?php

namespace App\Policies;

use App\Models\Answer;
use App\Models\User;

class AnswerPolicy
{
    public function update(User $user, Answer $answer): bool
    {
        return $answer->user_id === $user->id || $user->isStaff();
    }

    /**
     * An accepted answer holds community value; removing it afterwards is a
     * staff decision rather than a personal one.
     */
    public function delete(User $user, Answer $answer): bool
    {
        if ($user->isStaff()) {
            return true;
        }

        return $answer->user_id === $user->id && $answer->accepted_at === null;
    }

    public function vote(User $user, Answer $answer): bool
    {
        return $answer->user_id !== $user->id && ! $user->is_suspended;
    }
}
