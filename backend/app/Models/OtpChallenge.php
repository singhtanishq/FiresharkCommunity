<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtpChallenge extends Model
{
    public const PURPOSE_LOGIN = 'login';
    public const PURPOSE_SIGNUP_EMAIL = 'signup_email';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    protected $fillable = [
        'token', 'purpose', 'identifier', 'user_id', 'code_hash',
        'attempts', 'max_attempts', 'expires_at', 'consumed_at', 'locked_until',
        'ip', 'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'max_attempts' => 'integer',
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'locked_until' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('consumed_at')
            ->whereNull('locked_until')
            ->where('expires_at', '>', now());
    }

    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isConsumed(): bool
    {
        return $this->consumed_at !== null;
    }

    public function remainingAttempts(): int
    {
        return max(0, $this->max_attempts - $this->attempts);
    }
}
