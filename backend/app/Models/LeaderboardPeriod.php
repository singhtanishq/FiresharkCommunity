<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaderboardPeriod extends Model
{
    protected $fillable = ['period_key', 'type', 'start_date', 'end_date', 'status', 'finalized_at'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'finalized_at' => 'datetime',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(LeaderboardEntry::class, 'period_id');
    }

    /**
     * The period covering the current calendar month, created lazily.
     */
    public static function current(): self
    {
        $key = now()->format('Y-m');

        return static::firstOrCreate(
            ['period_key' => $key],
            [
                'type' => 'monthly',
                'start_date' => now()->startOfMonth()->toDateString(),
                'end_date' => now()->endOfMonth()->toDateString(),
                'status' => 'active',
            ]
        );
    }
}
