<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CommunityNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $type,
        public string $message,
        public string $url,
        public ?User $actor = null,
        public array $extra = [],
    ) {
    }

    /**
     * Database channel only. Email digests are a future, config-driven
     * addition and are intentionally not wired in this version.
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'message' => $this->message,
            'url' => $this->url,
            'actor' => $this->actor ? [
                'id' => $this->actor->id,
                'name' => $this->actor->name,
                'username' => $this->actor->username,
                'avatar_path' => $this->actor->avatar_path,
            ] : null,
            ...$this->extra,
        ];
    }
}
