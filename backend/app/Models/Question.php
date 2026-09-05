<?php

namespace App\Models;

use App\Enums\QuestionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Question extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'slug',
        'body',
        'status',
        'closed_reason',
    ];

    protected function casts(): array
    {
        return [
            'status' => QuestionStatus::class,
            'is_solved' => 'boolean',
            'closed_at' => 'datetime',
            'last_activity_at' => 'datetime',
        ];
    }

    // ------------------------------------------------------------------
    // Relationships
    // ------------------------------------------------------------------

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'question_tags');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(Answer::class);
    }

    public function acceptedAnswer(): BelongsTo
    {
        return $this->belongsTo(Answer::class, 'accepted_answer_id');
    }

    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    public function votes(): MorphMany
    {
        return $this->morphMany(Vote::class, 'votable');
    }

    public function followers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'question_followers')->withTimestamps();
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(QuestionRevision::class);
    }

    public function slugHistory(): HasMany
    {
        return $this->hasMany(QuestionSlug::class);
    }

    // ------------------------------------------------------------------
    // Scopes
    // ------------------------------------------------------------------

    /**
     * Questions visible to everyone (guests included).
     */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->whereIn('status', [
            QuestionStatus::Published->value,
            QuestionStatus::Closed->value,
        ]);
    }

    /**
     * Questions visible to a specific viewer. Staff additionally sees
     * hidden/pending content; authors see their own drafts.
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if ($user?->isStaff()) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->publiclyVisible();

            if ($user) {
                $q->orWhere(function (Builder $own) use ($user) {
                    $own->where('user_id', $user->id)
                        ->whereIn('status', [QuestionStatus::Draft->value, QuestionStatus::Pending->value]);
                });
            }
        });
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    public function isClosed(): bool
    {
        return $this->status === QuestionStatus::Closed;
    }

    public function shouldBeIndexed(): bool
    {
        return $this->status->isPubliclyVisible() && $this->deleted_at === null;
    }
}
