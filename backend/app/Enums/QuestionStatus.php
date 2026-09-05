<?php

namespace App\Enums;

enum QuestionStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Published = 'published';
    case Hidden = 'hidden';
    case Closed = 'closed';

    /**
     * Statuses that are publicly visible to guests and regular users.
     */
    public function isPubliclyVisible(): bool
    {
        return in_array($this, [self::Published, self::Closed], true);
    }
}
