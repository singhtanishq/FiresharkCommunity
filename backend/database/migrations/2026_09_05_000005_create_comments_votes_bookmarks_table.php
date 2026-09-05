<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Polymorphic comments attached to questions and answers.
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('commentable');
            $table->string('body', 2000);
            $table->enum('status', ['published', 'hidden'])->default('published');
            $table->timestamps();
            $table->softDeletes();

            $table->index('created_at');
        });

        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('votable');
            $table->tinyInteger('value'); // 1 = upvote, -1 = downvote
            $table->timestamps();

            // A user can hold exactly one vote (up or down) per entity.
            $table->unique(['user_id', 'votable_type', 'votable_id']);
        });

        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'question_id']);
        });

        Schema::create('question_followers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['question_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_followers');
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('votes');
        Schema::dropIfExists('comments');
    }
};
