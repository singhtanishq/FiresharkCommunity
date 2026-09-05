<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('body');
            $table->enum('status', ['published', 'hidden'])->default('published');
            $table->integer('votes_score')->default(0);
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['question_id', 'created_at']);
            $table->index('user_id');
            $table->fullText('body');
        });

        // A question references its accepted answer. The answers table must
        // exist first, so the constraint is added here.
        Schema::table('questions', function (Blueprint $table) {
            $table->foreign('accepted_answer_id')
                ->references('id')->on('answers')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('questions', function (Blueprint $table) {
            $table->dropForeign(['accepted_answer_id']);
        });
        Schema::dropIfExists('answers');
    }
};
