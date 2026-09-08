<?php

namespace Tests\Feature;

use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class PlatformBehaviourTest extends TestCase
{
    use RefreshDatabase;

    public function test_comments_can_be_posted_on_questions(): void
    {
        $user = $this->signIn();
        $question = Question::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/comments', [
                'commentable_type' => 'question',
                'commentable_id' => $question->id,
                'body' => 'What firewall is running on the target? That changes the answer.',
            ])
            ->assertCreated();

        $this->assertDatabaseHas('comments', [
            'commentable_type' => 'question',
            'commentable_id' => $question->id,
        ]);
    }

    public function test_guests_can_search_published_questions(): void
    {
        $question = Question::factory()->create([
            'title' => 'How can I detect open ports with Nmap on a scanned host?',
        ]);
        Question::factory()->create(['title' => 'Something entirely unrelated about incident response drills']);

        $response = $this->getJson('/api/v1/search?q=nmap+open+ports')
            ->assertOk();

        $this->assertGreaterThanOrEqual(1, $response->json('data.meta.total'));
        $titles = collect($response->json('data.data'))->pluck('title');
        $this->assertTrue($titles->contains(fn ($t) => str_contains($t, 'Nmap')));
    }

    public function test_current_month_leaderboard_reflects_reputation_earned(): void
    {
        Cache::forget('leaderboard:current');

        $answerer = User::factory()->create();
        $asker = User::factory()->create();
        $question = Question::factory()->create(['user_id' => $asker->id]);

        $answer = Answer::create([
            'question_id' => $question->id,
            'user_id' => $answerer->id,
            'body' => 'A solid answer that resolves the question and earns community acceptance today.',
        ]);
        $answer->forceFill(['accepted_at' => now()])->saveQuietly();

        // Mirror the reputation ledger the services write.
        $asker->increment('reputation', 2);
        $answerer->increment('reputation', 15);

        \App\Models\ReputationTransaction::create([
            'user_id' => $asker->id, 'action' => 'question_posted', 'points' => 2, 'created_at' => now(),
        ]);
        \App\Models\ReputationTransaction::create([
            'user_id' => $answerer->id, 'action' => 'answer_accepted', 'points' => 15, 'created_at' => now(),
        ]);

        $leaderboard = $this->getJson('/api/v1/leaderboard')->assertOk()->json('data');

        $this->assertEquals($answerer->username, $leaderboard['contributors'][0]['username']);
        $this->assertEquals(15, (int) $leaderboard['contributors'][0]['score']);
    }

    public function test_finalizing_a_month_snapshots_ranks(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();

        \App\Models\ReputationTransaction::create([
            'user_id' => $a->id, 'action' => 'answer_upvoted', 'points' => 50, 'created_at' => now(),
        ]);
        \App\Models\ReputationTransaction::create([
            'user_id' => $b->id, 'action' => 'answer_upvoted', 'points' => 90, 'created_at' => now(),
        ]);

        Cache::forget('leaderboard:current');
        $this->artisan('community:finalize-leaderboard', ['period' => now()->format('Y-m')]);

        $entries = \App\Models\LeaderboardEntry::query()->orderBy('rank')->get();
        $this->assertCount(2, $entries);
        $this->assertEquals($b->id, $entries[0]->user_id); // highest score first
        $this->assertEquals(1, $entries[0]->rank);
        $this->assertEquals(2, $entries[1]->rank);
    }

    public function test_login_is_rate_limited(): void
    {
        $user = User::factory()->create(['password' => 'Password123!']);

        for ($i = 0; $i < 10; $i++) {
            $this->withCredentials()->postJson('/api/v1/auth/login/start', ['email' => $user->email, 'password' => 'wrong']);
        }

        $this->withCredentials()->postJson('/api/v1/auth/login/start', ['email' => $user->email, 'password' => 'wrong'])
            ->assertStatus(429);
    }

    public function test_bookmarks_and_follows_toggle(): void
    {
        $user = $this->signIn();
        $question = Question::factory()->create();

        $this->actingAs($user)->postJson("/api/v1/questions/{$question->id}/bookmark")
            ->assertOk()->assertJsonPath('data.bookmarked', true);

        $this->actingAs($user)->postJson("/api/v1/questions/{$question->id}/bookmark")
            ->assertOk()->assertJsonPath('data.bookmarked', false);

        $this->actingAs($user)->postJson("/api/v1/questions/{$question->id}/follow")
            ->assertOk()->assertJsonPath('data.following', true);
    }
}
