<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Monthly competition windows. The primary leaderboard is monthly;
        // results are snapshotted into leaderboard_entries when a period is
        // finalized so historical boards are preserved forever.
        Schema::create('leaderboard_periods', function (Blueprint $table) {
            $table->id();
            $table->string('period_key', 20)->unique(); // e.g. 2026-09
            $table->enum('type', ['monthly'])->default('monthly');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['active', 'finalized'])->default('active')->index();
            $table->timestamp('finalized_at')->nullable();
            $table->timestamps();
        });

        Schema::create('leaderboard_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('period_id')->constrained('leaderboard_periods')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('score')->default(0);
            $table->unsignedInteger('rank')->default(0);
            $table->unsignedInteger('questions_count')->default(0);
            $table->unsignedInteger('answers_count')->default(0);
            $table->unsignedInteger('accepted_answers_count')->default(0);
            $table->timestamps();

            $table->unique(['period_id', 'user_id']);
            $table->index(['period_id', 'rank']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard_entries');
        Schema::dropIfExists('leaderboard_periods');
    }
};
