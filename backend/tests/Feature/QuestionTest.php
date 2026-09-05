<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuestionTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::factory()->create();
    }

    protected function validQuestion(array $overrides = []): array
    {
        return array_merge([
            'title' => 'How do I troubleshoot an Nmap scan that shows no open ports?',
            'body' => 'I am scanning a host in my lab and every port reports filtered even though SSH is running on the target machine.',
            'category_id' => $this->category->id,
            'tags' => ['nmap', 'networking'],
        ], $overrides);
    }

    public function test_guests_can_browse_questions(): void
    {
        Question::factory()->count(3)->create(['category_id' => $this->category->id]);

        $this->getJson('/api/v1/questions')
            ->assertOk()
            ->assertJsonPath('meta.total', 3);
    }

    public function test_guests_cannot_ask_questions(): void
    {
        $this->postJson('/api/v1/questions', $this->validQuestion())
            ->assertStatus(401);
    }

    public function test_unverified_users_cannot_ask_questions(): void
    {
        config(['community.require_email_verification' => true]);

        $user = User::factory()->unverified()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/questions', $this->validQuestion())
            ->assertStatus(403);
    }

    public function test_question_validation_rules(): void
    {
        $user = $this->signIn();

        $this->actingAs($user)
            ->postJson('/api/v1/questions', $this->validQuestion([
                'title' => 'Help', // too short
                'body' => 'short', // too short
                'category_id' => 99999, // missing
                'tags' => ['a', 'b', 'c', 'd', 'e', 'f'], // too many
            ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'body', 'category_id', 'tags']);
    }

    public function test_asking_a_question_creates_slug_and_counters(): void
    {
        $user = $this->signIn();
        $reputationBefore = $user->reputation;

        // Regular users may only attach existing tags.
        \App\Models\Tag::factory()->create(['name' => 'nmap', 'slug' => 'nmap']);
        \App\Models\Tag::factory()->create(['name' => 'networking', 'slug' => 'networking']);

        $response = $this->actingAs($user)
            ->postJson('/api/v1/questions', $this->validQuestion())
            ->assertCreated();

        $slug = $response->json('data.slug');
        $this->assertStringContainsString('nmap-scan', $slug);

        $question = Question::query()->where('slug', $slug)->firstOrFail();
        $this->assertEquals($user->id, $question->user_id);
        $this->assertEquals(2, $question->tags()->count());
        $this->assertDatabaseHas('reputation_transactions', [
            'user_id' => $user->id,
            'action' => 'question_posted',
            'source_id' => $question->id,
        ]);
        $this->assertEquals($reputationBefore + 2, $user->refresh()->reputation);
        $this->assertEquals(1, $this->category->refresh()->questions_count);
        $this->assertDatabaseHas('user_badges', ['user_id' => $user->id]); // First Question badge
    }

    public function test_author_can_update_and_slug_history_is_kept(): void
    {
        $author = $this->signIn();
        $question = Question::factory()->create(['user_id' => $author->id, 'category_id' => $this->category->id]);
        $originalSlug = $question->slug;

        $this->actingAs($author)
            ->putJson("/api/v1/questions/{$question->id}", [
                'title' => 'Why does my Nmap scan report every single port as filtered?',
            ])
            ->assertOk();

        $question->refresh();
        $this->assertNotEquals($originalSlug, $question->slug);
        $this->assertDatabaseHas('question_slugs', ['slug' => $originalSlug, 'question_id' => $question->id]);
        $this->assertDatabaseHas('question_revisions', ['question_id' => $question->id, 'editor_id' => $author->id]);
    }

    public function test_others_cannot_edit_or_delete_someones_question(): void
    {
        $question = Question::factory()->create(['category_id' => $this->category->id]);
        $intruder = $this->signIn();

        $this->actingAs($intruder)
            ->putJson("/api/v1/questions/{$question->id}", ['title' => 'Hijacked title that is long enough to pass validation'])
            ->assertForbidden();

        $this->actingAs($intruder)
            ->deleteJson("/api/v1/questions/{$question->id}")
            ->assertForbidden();
    }

    public function test_author_cannot_delete_a_question_with_answers(): void
    {
        $author = $this->signIn();
        $question = Question::factory()->create(['user_id' => $author->id, 'category_id' => $this->category->id]);
        $answerer = User::factory()->create();

        $this->actingAs($answerer)
            ->postJson("/api/v1/questions/{$question->id}/answers", [
                'body' => 'A community answer with enough content to be realistic and useful here.',
            ])->assertCreated();

        $this->actingAs($author)
            ->deleteJson("/api/v1/questions/{$question->id}")
            ->assertForbidden();
    }

    public function test_slug_changes_301_redirect_through_api(): void
    {
        $author = $this->signIn();
        $question = Question::factory()->create(['user_id' => $author->id, 'category_id' => $this->category->id]);
        $originalSlug = $question->slug;

        $this->actingAs($author)
            ->putJson("/api/v1/questions/{$question->id}", [
                'title' => 'An entirely new title for slug redirect testing',
            ])->assertOk();

        $newSlug = $question->refresh()->slug;

        $response = $this->getJson("/api/v1/questions/{$originalSlug}");
        $response->assertOk()->assertJsonPath('data.redirect', true)->assertJsonPath('data.to', "/questions/{$newSlug}");
    }

    public function test_hidden_questions_are_not_listed_but_staff_see_them(): void
    {
        Question::factory()->count(2)->create(['category_id' => $this->category->id]);
        Question::factory()->create(['status' => 'hidden', 'category_id' => $this->category->id]);

        $this->getJson('/api/v1/questions')->assertJsonPath('meta.total', 2);

        $moderator = $this->signIn(User::factory()->moderator()->create());
        $this->actingAs($moderator)
            ->getJson('/api/v1/questions')
            ->assertJsonPath('meta.total', 3);
    }

    public function test_sorting_and_filters(): void
    {
        $solved = Question::factory()->create(['category_id' => $this->category->id, 'is_solved' => true, 'views' => 500, 'answers_count' => 2]);
        Question::factory()->create(['category_id' => $this->category->id, 'views' => 10]);
        Question::factory()->create(['category_id' => $this->category->id, 'answers_count' => 0]);

        $this->getJson('/api/v1/questions?sort=most_viewed')
            ->assertOk()
            ->assertJsonPath('data.0.id', $solved->id);

        $this->getJson('/api/v1/questions?unanswered=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }
}
