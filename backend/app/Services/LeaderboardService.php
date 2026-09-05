<?php

namespace App\Services;

use App\Models\LeaderboardPeriod;
use Illuminate\Support\Facades\Cache;

/**
 * The current-month leaderboard is computed from the reputation ledger and
 * content counters over an indexed month window, then cached briefly, so no
 * expensive global ranking runs on every page request. Historical months are
 * snapshotted into leaderboard_entries when finalized.
 */
class LeaderboardService
{
    protected const CACHE_TTL = 600;

    public function current(): array
    {
        return Cache::remember('leaderboard:current', self::CACHE_TTL, function () {
            return [
                'contributors' => $this->topContributors(),
                'askers' => $this->topAskers(),
                'answerers' => $this->topAnswerers(),
            ];
        });
    }

    public function topContributors(int $limit = 25): array
    {
        $monthStart = now()->startOfMonth();

        $rows = \Illuminate\Support\Facades\DB::table('reputation_transactions as rt')
            ->join('users as u', 'u.id', '=', 'rt.user_id')
            ->where('rt.created_at', '>=', $monthStart)
            ->where('u.is_suspended', false)
            ->groupBy('rt.user_id', 'u.id', 'u.name', 'u.username', 'u.avatar_path', 'u.reputation')
            ->orderByDesc(\Illuminate\Support\Facades\DB::raw('SUM(rt.points)'))
            ->limit($limit)
            ->get([
                'rt.user_id',
                'u.name',
                'u.username',
                'u.avatar_path',
                'u.reputation as all_time_reputation',
                \Illuminate\Support\Facades\DB::raw('SUM(rt.points) as score'),
            ]);

        return $rows->map(fn ($row) => (array) $row)->values()->all();
    }

    public function topAskers(int $limit = 25): array
    {
        $monthStart = now()->startOfMonth();

        return \App\Models\Question::query()
            ->join('users', 'users.id', '=', 'questions.user_id')
            ->where('questions.created_at', '>=', $monthStart)
            ->where('questions.status', 'published')
            ->where('users.is_suspended', false)
            ->groupBy('questions.user_id', 'users.id', 'users.name', 'users.username', 'users.avatar_path', 'users.reputation')
            ->orderByDesc(\Illuminate\Support\Facades\DB::raw('COUNT(*)'))
            ->limit($limit)
            ->get([
                'questions.user_id',
                'users.name',
                'users.username',
                'users.avatar_path',
                'users.reputation as all_time_reputation',
                \Illuminate\Support\Facades\DB::raw('COUNT(*) as questions_count'),
            ])
            ->values()
            ->toArray();
    }

    public function topAnswerers(int $limit = 25): array
    {
        $monthStart = now()->startOfMonth();

        return \App\Models\Answer::query()
            ->join('users', 'users.id', '=', 'answers.user_id')
            ->where('answers.created_at', '>=', $monthStart)
            ->whereNull('answers.deleted_at')
            ->where('users.is_suspended', false)
            ->groupBy('answers.user_id', 'users.id', 'users.name', 'users.username', 'users.avatar_path', 'users.reputation')
            ->orderByDesc(\Illuminate\Support\Facades\DB::raw('COUNT(*)'))
            ->limit($limit)
            ->get([
                'answers.user_id',
                'users.name',
                'users.username',
                'users.avatar_path',
                'users.reputation as all_time_reputation',
                \Illuminate\Support\Facades\DB::raw('COUNT(*) as answers_count'),
                \Illuminate\Support\Facades\DB::raw("SUM(CASE WHEN answers.accepted_at IS NOT NULL THEN 1 ELSE 0 END) as accepted_answers_count"),
            ])
            ->values()
            ->map(fn ($row) => (array) $row)
            ->all();
    }

    /**
     * Snapshot the given month's entries and close the period. Called by
     * the scheduler on the 1st of each month (and available to admins).
     */
    public function finalize(string $periodKey): ?LeaderboardPeriod
    {
        // The period row may not exist yet if no leaderboard activity
        // happened this month; create it so snapshots always work.
        $period = LeaderboardPeriod::query()->firstOrCreate(
            ['period_key' => $periodKey],
            [
                'type' => 'monthly',
                'start_date' => \Carbon\Carbon::createFromFormat('Y-m', $periodKey)->startOfMonth()->toDateString(),
                'end_date' => \Carbon\Carbon::createFromFormat('Y-m', $periodKey)->endOfMonth()->toDateString(),
                'status' => 'active',
            ]
        );

        if ($period->status === 'finalized') {
            return null;
        }

        $snapshot = collect([
            'contributors' => $this->topContributors(100),
            'askers' => $this->topAskers(100),
            'answerers' => $this->topAnswerers(100),
        ]);

        foreach ($snapshot as $list) {
            $rank = 0;
            $lastScore = null;
            $position = 0;

            foreach ($list as $row) {
                $position++;
                $score = (int) ($row['score'] ?? $row['questions_count'] ?? $row['answers_count'] ?? 0);

                if ($score !== $lastScore) {
                    $rank = $position;
                    $lastScore = $score;
                }

                \App\Models\LeaderboardEntry::updateOrCreate(
                    [
                        'period_id' => $period->id,
                        'user_id' => $row['user_id'],
                    ],
                    [
                        'score' => $score,
                        'rank' => $rank,
                        'questions_count' => $row['questions_count'] ?? 0,
                        'answers_count' => $row['answers_count'] ?? 0,
                        'accepted_answers_count' => $row['accepted_answers_count'] ?? 0,
                    ],
                );
            }
        }

        $period->update([
            'status' => 'finalized',
            'finalized_at' => now(),
        ]);

        Cache::forget('leaderboard:current');
        Cache::forget('leaderboard:periods');

        return $period;
    }

    public function finalizedPeriods()
    {
        return Cache::remember('leaderboard:periods', self::CACHE_TTL, function () {
            return LeaderboardPeriod::query()
                ->where('status', 'finalized')
                ->orderByDesc('period_key')
                ->get(['id', 'period_key', 'start_date', 'end_date', 'status', 'finalized_at'])
                ->values();
        });
    }
}
