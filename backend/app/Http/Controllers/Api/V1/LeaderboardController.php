<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\LeaderboardService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    use ApiResponse;

    public function __construct(protected LeaderboardService $leaderboard)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $monthKey = $request->query('month'); // e.g. 2026-08 for archive pages

        if ($monthKey && $monthKey !== now()->format('Y-m')) {
            $period = \App\Models\LeaderboardPeriod::query()
                ->where('period_key', $monthKey)
                ->where('status', 'finalized')
                ->first();

            if (! $period) {
                return $this->error('No finalized leaderboard found for that month.', 404);
            }

            $entries = $period->entries()
                ->join('users', 'users.id', '=', 'leaderboard_entries.user_id')
                ->where('users.is_suspended', false)
                ->orderBy('rank')
                ->limit(50)
                ->get([
                    'leaderboard_entries.rank',
                    'leaderboard_entries.score',
                    'leaderboard_entries.questions_count',
                    'leaderboard_entries.answers_count',
                    'leaderboard_entries.accepted_answers_count',
                    'users.id as user_id', 'users.name', 'users.username', 'users.avatar_path', 'users.reputation as all_time_reputation',
                ]);

            return $this->success([
                'period' => [
                    'period_key' => $period->period_key,
                    'start_date' => $period->start_date,
                    'end_date' => $period->end_date,
                ],
                'contributors' => $entries,
                'askers' => $entries->sortByDesc('questions_count')->values(),
                'answerers' => $entries->sortByDesc('answers_count')->values(),
            ]);
        }

        $current = $this->leaderboard->current();

        return $this->success([
            'period' => [
                'period_key' => now()->format('Y-m'),
                'start_date' => now()->startOfMonth()->toDateString(),
                'end_date' => now()->endOfMonth()->toDateString(),
                'is_current' => true,
            ],
            ...$current,
            'all_time' => [
                'contributors' => $this->allTimeContributors(),
            ],
            'archive' => $this->leaderboard->finalizedPeriods(),
        ]);
    }

    protected function allTimeContributors(int $limit = 25): array
    {
        return \App\Models\User::query()
            ->notSuspended()
            ->where('reputation', '>', 0)
            ->orderByDesc('reputation')
            ->limit($limit)
            ->get(['id', 'name', 'username', 'avatar_path', 'reputation', 'questions_count', 'answers_count', 'accepted_answers_count'])
            ->values()
            ->toArray();
    }
}
