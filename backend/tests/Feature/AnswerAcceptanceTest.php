<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnswerAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    protected Question $question;

    protected User $author;

    protected function setUp(): void
    {
        parent::setUp();

        $this->author = User::factory()->create();
        $this->question = Question::factory()->create(['user_id' => $this->author->id]);
    }

    protected function createAnswer(User $responder): Answer
    {
        return Answer::create([
            'question_id' => $this->question->id,
            'user_id' => $responder->id,
            'body' => 'Here is a concrete solution: check the firewall first, then compare a TCP connect scan with a SYN scan to isolate stateful filtering behaviour.',
        ]);
    }

    public function test_user_can_answer_a_question(): void
    {
        $responder = User::factory()->create();

        $this->actingAs($responder)
            ->postJson("/api/v1/questions/{$this->question->id}/answers", [
                'body' => 'Check the target firewall first: SYN packets may be dropped rather than rejected, which Nmap reports as filtered.',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertEquals(1, $this->question->fresh()->answers_count);
        $this->assertDatabaseHas('user_badges', ['user_id' => $responder->id]); // First Answer
    }

    public function test_closed_questions_cannot_be_answered(): void
    {
        $this->question->forceFill(['status' => 'closed', 'closed_at' => now(), 'closed_reason' => 'duplicate'])->saveQuietly();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/v1/questions/{$this->question->id}/answers", ['body' => 'A late answer that should be rejected because the question is closed.'])
            ->assertForbidden();
    }

    public function test_only_the_question_author_can_accept(): void
    {
        $responder = User::factory()->create();
        $answer = $this->createAnswer($responder);

        $this->actingAs($responder)
            ->postJson("/api/v1/answers/{$answer->id}/accept")
            ->assertForbidden();

        $this->actingAs($this->author)
            ->postJson("/api/v1/answers/{$answer->id}/accept")
            ->assertOk();

        $this->assertTrue($this->question->fresh()->is_solved);
        $this->assertNotNull($answer->fresh()->accepted_at);
        $this->assertEquals(15, $responder->fresh()->reputation); // answer_accepted
        $this->assertEquals(1, $responder->fresh()->accepted_answers_count);
    }

    public function test_accepting_a_second_answer_replaces_the_first(): void
    {
        $first = $this->createAnswer(User::factory()->create());
        $second = $this->createAnswer(User::factory()->create());

        $this->actingAs($this->author)->postJson("/api/v1/answers/{$first->id}/accept")->assertOk();
        $this->actingAs($this->author)->postJson("/api/v1/answers/{$second->id}/accept")->assertOk();

        $this->assertNull($first->fresh()->accepted_at);
        $this->assertNotNull($second->fresh()->accepted_at);
        $this->assertEquals(0, $first->user->fresh()->reputation);
        $this->assertEquals(15, $second->user->fresh()->reputation);
    }

    public function test_staff_can_accept_on_behalf_of_the_author(): void
    {
        $answer = $this->createAnswer(User::factory()->create());
        $moderator = User::factory()->moderator()->create();

        $this->actingAs($moderator)
            ->postJson("/api/v1/answers/{$answer->id}/accept")
            ->assertOk();

        $this->assertTrue($this->question->fresh()->is_solved);
    }

    public function test_answer_author_cannot_delete_an_accepted_answer(): void
    {
        $responder = User::factory()->create();
        $answer = $this->createAnswer($responder);

        $this->actingAs($this->author)->postJson("/api/v1/answers/{$answer->id}/accept")->assertOk();

        $this->actingAs($responder)
            ->deleteJson("/api/v1/answers/{$answer->id}")
            ->assertForbidden();
    }

    public function test_deleting_an_answer_rolls_back_reputation(): void
    {
        $responder = User::factory()->create();
        $answer = $this->createAnswer($responder);

        $this->actingAs($this->author)->postJson("/api/v1/answers/{$answer->id}/accept")->assertOk();
        $this->assertEquals(15, $responder->fresh()->reputation);

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin)->postJson('/api/v1/admin/content/delete', [
            'type' => 'answer',
            'id' => $answer->id,
            'reason' => 'test cleanup',
        ])->assertOk();

        $this->assertEquals(0, $responder->fresh()->reputation);
        $this->assertEquals(0, $responder->fresh()->accepted_answers_count);
    }
}
