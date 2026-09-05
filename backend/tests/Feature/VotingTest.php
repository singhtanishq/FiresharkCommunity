<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VotingTest extends TestCase
{
    use RefreshDatabase;

    protected Question $question;

    protected User $author;

    protected User $voter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->author = User::factory()->create();
        $this->voter = User::factory()->create();
        $this->question = Question::factory()->create(['user_id' => $this->author->id]);

        $this->author->update(['reputation' => 0]);
    }

    public function test_user_can_upvote_and_reputation_is_awarded(): void
    {
        $this->actingAs($this->voter)
            ->postJson('/api/v1/votes', [
                'votable_type' => 'question',
                'votable_id' => $this->question->id,
                'value' => 1,
            ])
            ->assertOk()
            ->assertJsonPath('data.my_vote', 1)
            ->assertJsonPath('data.votes_score', 1);

        $this->assertEquals(1, $this->question->fresh()->votes_score);
        $this->assertEquals(5, $this->author->fresh()->reputation); // question_upvoted
    }

    public function test_toggling_the_same_vote_removes_it_and_rolls_back_reputation(): void
    {
        $this->actingAs($this->voter)->postJson('/api/v1/votes', [
            'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => 1,
        ])->assertOk();

        $this->actingAs($this->voter)->postJson('/api/v1/votes', [
            'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => 1,
        ])->assertOk()->assertJsonPath('data.my_vote', 0);

        $this->assertEquals(0, $this->question->fresh()->votes_score);
        $this->assertEquals(0, $this->author->fresh()->reputation);
    }

    public function test_flipping_vote_direction_adjusts_score_and_reputation(): void
    {
        $this->actingAs($this->voter)->postJson('/api/v1/votes', [
            'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => 1,
        ])->assertOk();

        $this->actingAs($this->voter)->postJson('/api/v1/votes', [
            'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => -1,
        ])->assertOk()->assertJsonPath('data.my_vote', -1);

        $this->assertEquals(-1, $this->question->fresh()->votes_score);
        // +5 upvote applied then revoked, -2 downvote applied.
        $this->assertEquals(-2, $this->author->fresh()->reputation);
    }

    public function test_users_cannot_vote_on_their_own_content(): void
    {
        $this->actingAs($this->author)
            ->postJson('/api/v1/votes', [
                'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => 1,
            ])
            ->assertForbidden();
    }

    public function test_votes_are_unique_per_user_per_entity(): void
    {
        $this->actingAs($this->voter)->postJson('/api/v1/votes', [
            'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => 1,
        ])->assertOk();

        $this->actingAs($this->voter)->postJson('/api/v1/votes', [
            'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => -1,
        ])->assertOk();

        $this->assertDatabaseCount('votes', 1);
    }

    public function test_guests_cannot_vote(): void
    {
        $this->postJson('/api/v1/votes', [
            'votable_type' => 'question', 'votable_id' => $this->question->id, 'value' => 1,
        ])->assertStatus(401);
    }

    public function test_answer_upvotes_are_scored_and_awarded(): void
    {
        $answerer = User::factory()->create();
        $answer = Answer::create([
            'question_id' => $this->question->id,
            'user_id' => $answerer->id,
            'body' => 'A helpful answer with enough detail to be a realistic community contribution here.',
        ]);
        $answerer->update(['reputation' => 0]);

        $this->actingAs($this->voter)->postJson('/api/v1/votes', [
            'votable_type' => 'answer', 'votable_id' => $answer->id, 'value' => 1,
        ])->assertOk();

        $this->assertEquals(1, $answer->fresh()->votes_score);
        $this->assertEquals(10, $answerer->fresh()->reputation); // answer_upvoted
    }
}
