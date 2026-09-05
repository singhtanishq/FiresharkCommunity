<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, MustVerifyEmailTrait, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'bio',
        'expertise',
        'location',
        'website',
        'avatar_path',
        'notification_preferences',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'password' => 'hashed',
            'is_suspended' => 'boolean',
            'notification_preferences' => 'array',
            'role' => UserRole::class,
        ];
    }

    // ------------------------------------------------------------------
    // Relationships
    // ------------------------------------------------------------------

    public function questions(): HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }

    public function bookmarks(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'bookmarks')->withTimestamps();
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'user_badges')
            ->withPivot('awarded_by', 'created_at');
    }

    public function reputationTransactions(): HasMany
    {
        return $this->hasMany(ReputationTransaction::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(UserVerification::class);
    }

    public function moderationActions(): HasMany
    {
        return $this->hasMany(ModerationAction::class, 'moderator_id');
    }

    // ------------------------------------------------------------------
    // Authentication notifications
    // ------------------------------------------------------------------

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    // ------------------------------------------------------------------
    // Role helpers
    // ------------------------------------------------------------------

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isModerator(): bool
    {
        return $this->role === UserRole::Moderator;
    }

    public function isStaff(): bool
    {
        return $this->role?->isStaff() ?? false;
    }

    /**
     * The administrator-controlled verification badge currently shown on
     * the profile (latest non-revoked one).
     */
    public function activeVerification(): ?UserVerification
    {
        return $this->verifications()
            ->whereNull('revoked_at')
            ->latest('created_at')
            ->first();
    }

    public function markActivity(): void
    {
        if ($this->last_activity_at === null || $this->last_activity_at->diffInMinutes(now()) >= 5) {
            $this->forceFill(['last_activity_at' => now()])->saveQuietly();
        }
    }

    // ------------------------------------------------------------------
    // Scopes
    // ------------------------------------------------------------------

    public function scopeStaff(Builder $query): Builder
    {
        return $query->whereIn('role', [UserRole::Moderator->value, UserRole::Admin->value]);
    }

    public function scopeNotSuspended(Builder $query): Builder
    {
        return $query->where('is_suspended', false);
    }
}
