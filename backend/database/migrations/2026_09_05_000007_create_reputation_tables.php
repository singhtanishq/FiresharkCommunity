<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Configurable point values per action so reputation rules can be
        // adjusted from the admin panel without code changes.
        Schema::create('reputation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('action', 60)->unique();
            $table->string('label', 100);
            $table->integer('points');
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();
        });

        // Append-only ledger. users.reputation is a cached total derived
        // from this table and is always adjusted through ReputationService.
        Schema::create('reputation_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action', 60)->index();
            $table->integer('points');
            $table->nullableMorphs('source');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reputation_transactions');
        Schema::dropIfExists('reputation_rules');
    }
};
