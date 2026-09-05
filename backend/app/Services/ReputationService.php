<?php

namespace App\Services;

use App\Models\ReputationRule;
use App\Models\ReputationTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * All reputation changes flow through this service. users.reputation is a
 * cached total; the authoritative record is the reputation_transactions
 * ledger, which makes every point auditable and reversible.
 */
class ReputationService
{
    public function award(User $user, string $action, ?Model $source = null, ?string $actorNote = null): void
    {
        $rule = ReputationRule::query()
            ->where('action', $action)
            ->where('is_enabled', true)
            ->first();

        if (! $rule || $rule->points === 0) {
            return;
        }

        DB::transaction(function () use ($user, $action, $source, $rule) {
            ReputationTransaction::create([
                'user_id' => $user->id,
                'action' => $action,
                'points' => $rule->points,
                'source_type' => $source?->getMorphClass(),
                'source_id' => $source?->getKey(),
                'created_at' => now(),
            ]);

            $user->increment('reputation', $rule->points);
        });

        if (abs($rule->points) >= 10) {
            Log::info('Reputation awarded', [
                'user_id' => $user->id,
                'action' => $action,
                'points' => $rule->points,
                'source' => $source ? $source->getMorphClass().':'.$source->getKey() : null,
                'note' => $actorNote,
            ]);
        }
    }

    /**
     * Reverse a previously awarded action for a given source. Used for
     * vote changes and deleted-content reputation rollback.
     */
    public function revokeForSource(User $user, string $action, Model $source): void
    {
        DB::transaction(function () use ($user, $action, $source) {
            $reversed = ReputationTransaction::query()
                ->where('user_id', $user->id)
                ->where('action', $action)
                ->where('source_type', $source->getMorphClass())
                ->where('source_id', $source->getKey())
                ->get();

            foreach ($reversed as $transaction) {
                $user->decrement('reputation', $transaction->points);
                $transaction->delete();
            }
        });
    }

    /**
     * Remove every reputation event earned from a piece of content
     * (used when content is deleted by moderation).
     */
    public function revokeAllForSource(Model $source): void
    {
        DB::transaction(function () use ($source) {
            $transactions = ReputationTransaction::query()
                ->where('source_type', $source->getMorphClass())
                ->where('source_id', $source->getKey())
                ->get();

            foreach ($transactions as $transaction) {
                User::query()->whereKey($transaction->user_id)->decrement('reputation', $transaction->points);
                $transaction->delete();
            }
        });
    }
}
