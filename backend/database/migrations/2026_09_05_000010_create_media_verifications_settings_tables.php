<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('disk', 30)->default('public');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->string('original_name', 255)->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        // Administrator-controlled verification badges. Users can never
        // self-assign these; the active row (revoked_at IS NULL) is shown.
        Schema::create('user_verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['team', 'instructor', 'expert', 'alumni', 'professional']);
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('revoked_at')->nullable();

            $table->index(['user_id', 'revoked_at']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->longText('value')->nullable();
            $table->string('type', 20)->default('text');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('user_verifications');
        Schema::dropIfExists('media');
    }
};
