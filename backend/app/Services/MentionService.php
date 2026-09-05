<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Extracts @username mentions from content bodies and resolves them to
 * real users. Abuse is bounded by content rate limits rather than a
 * per-mention cap.
 */
class MentionService
{
    protected const PATTERN = '/@([a-zA-Z0-9_]{2,30})/';

    public function mentionedUsers(string $body): Collection
    {
        preg_match_all(self::PATTERN, $body, $matches);

        if (empty($matches[1])) {
            return collect();
        }

        $usernames = array_unique(array_map('strtolower', $matches[1]));

        return User::query()
            ->whereIn(\DB::raw('LOWER(username)'), $usernames)
            ->where('is_suspended', false)
            ->limit(20)
            ->get();
    }
}
