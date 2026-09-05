<?php

namespace App\Console\Commands;

use App\Services\LeaderboardService;
use Illuminate\Console\Command;

class FinalizeLeaderboardCommand extends Command
{
    protected $signature = 'community:finalize-leaderboard {period? : Period key like 2026-08 (defaults to previous month)}';

    protected $description = 'Snapshot and finalize a monthly leaderboard period';

    public function handle(LeaderboardService $leaderboard): int
    {
        $periodKey = $this->argument('period') ?? now()->subMonth()->format('Y-m');

        $period = $leaderboard->finalize($periodKey);

        if (! $period) {
            $this->warn("Period {$periodKey} not found or already finalized.");

            return self::SUCCESS;
        }

        $this->info("Leaderboard for {$periodKey} finalized with ".$period->entries()->count().' entries.');

        return self::SUCCESS;
    }
}
