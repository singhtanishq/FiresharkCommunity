<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaderboardEntry extends Model
{
    protected $fillable = [
        'period_id', 'user_id', 'score', 'rank', 'questions_count', 'answers_count', 'accepted_answers_count',
    ];

    public function period(): BelongsTo
    {
        return $this->belongsTo(LeaderboardPeriod::class, 'period_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
