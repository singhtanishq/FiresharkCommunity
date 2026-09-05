<?php

namespace App\Services;

use App\Models\User;

/**
 * Creates database notifications for community events while honouring each
 * recipient's notification preferences. The actor never receives their own
 * event notification.
 */
class NotificationService
{
    public function send(User $recipient, string $type, string $message, string $url, ?User $actor = null, array $extra = []): void
    {
        if ($actor && $actor->id === $recipient->id) {
            return;
        }

        $prefs = $recipient->notification_preferences ?? [];
        $category = match (true) {
            str_starts_with($type, 'answer_') || $type === 'question_answered' => 'answers',
            str_starts_with($type, 'comment_') => 'comments',
            $type === 'mention' => 'mentions',
            $type === 'badge_earned' => 'badges',
            $type === 'moderation_action' => 'moderation',
            default => 'general',
        };

        if (array_key_exists($category, $prefs) && $prefs[$category] === false) {
            return;
        }

        $recipient->notify(new \App\Notifications\CommunityNotification(
            type: $type,
            message: $message,
            url: $url,
            actor: $actor,
            extra: $extra,
        ));
    }
}
