<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('title', 180);
            $table->string('slug', 220)->unique();
            $table->longText('body');
            $table->enum('status', ['draft', 'pending', 'published', 'hidden', 'closed'])->default('published')->index();
            $table->unsignedInteger('views')->default(0)->index();
            $table->integer('votes_score')->default(0)->index();
            $table->unsignedInteger('answers_count')->default(0);
            $table->unsignedBigInteger('accepted_answer_id')->nullable();
            $table->boolean('is_solved')->default(false)->index();
            $table->string('closed_reason')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            // Full-text search across title and body (MySQL InnoDB).
            $table->fullText(['title', 'body']);
        });

        // Tags pivot lives here because it references this table.
        Schema::create('question_tags', function (Blueprint $table) {
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['question_id', 'tag_id']);
        });

        // Slugs previously used by a question, kept for SEO-safe 301 redirects
        // when a question title (and therefore slug) changes.
        Schema::create('question_slugs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 220)->unique();
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('question_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('editor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('old_title', 180)->nullable();
            $table->string('new_title', 180)->nullable();
            $table->longText('old_body')->nullable();
            $table->longText('new_body')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_tags');
        Schema::dropIfExists('question_revisions');
        Schema::dropIfExists('question_slugs');
        Schema::dropIfExists('questions');
    }
};
