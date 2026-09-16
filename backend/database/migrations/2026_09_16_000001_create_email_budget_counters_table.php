<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Email budget counters for the global outbound email circuit breaker.
 *
 * Each row represents a time-window counter (e.g. "emails sent in hour 2024-01-15 14:00").
 * The bucket_key is a composite identifier:
 *   email:budget:{scope}:{identifier}:{window_start}
 * where scope is one of: global, endpoint, ip, email
 *
 * Concurrency: INSERT ... ON DUPLICATE KEY UPDATE is atomic in InnoDB.
 * The UNIQUE constraint on bucket_key prevents duplicate rows even under
 * 100 concurrent requests.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_budget_counters', function (Blueprint $table) {
            $table->id();
            $table->string('bucket_key', 255)->unique();
            $table->string('bucket_type', 20)->index(); // global | endpoint | ip | email
            $table->string('scope_id', 191)->nullable()->index(); // the email, IP, or endpoint name
            $table->integer('count')->default(0);
            $table->timestamp('window_start')->index();
            $table->timestamp('window_end')->index();
            $table->timestamps();

            // Covering index for common lookups
            $table->index(['bucket_type', 'window_start', 'window_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_budget_counters');
    }
};
