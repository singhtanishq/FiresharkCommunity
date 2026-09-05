<?php

namespace Tests\Feature;

use App\Models\Question;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_users_cannot_access_admin_endpoints(): void
    {
        $user = $this->signIn();

        $this->actingAs($user)->getJson('/api/v1/admin/dashboard')->assertForbidden();
        $this->actingAs($user)->getJson('/api/v1/admin/users')->assertForbidden();
        $this->actingAs($user)->postJson('/api/v1/admin/content/hide', ['type' => 'question', 'id' => 1])->assertForbidden();
    }

    public function test_moderators_cannot_change_roles_but_admins_can(): void
    {
        $target = User::factory()->create();
        $moderator = User::factory()->moderator()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAs($moderator)
            ->postJson("/api/v1/admin/users/{$target->id}/role", ['role' => 'admin'])
            ->assertForbidden();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/users/{$target->id}/role", ['role' => 'moderator'])
            ->assertOk();

        $this->assertEquals('moderator', $target->fresh()->role->value);
    }

    public function test_cannot_demote_the_last_administrator(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/users/{$admin->id}/role", ['role' => 'user'])
            ->assertStatus(422);
    }

    public function test_moderator_can_hide_and_restore_content(): void
    {
        $question = Question::factory()->create();
        $categoryBefore = $question->category->questions_count;
        $moderator = User::factory()->moderator()->create();

        $this->actingAs($moderator)->postJson('/api/v1/admin/content/hide', [
            'type' => 'question', 'id' => $question->id, 'reason' => 'spam',
        ])->assertOk();

        $this->assertEquals('hidden', $question->fresh()->status->value);
        $this->assertDatabaseHas('moderation_actions', [
            'moderator_id' => $moderator->id, 'action' => 'hide',
        ]);

        $this->actingAs($moderator)->postJson('/api/v1/admin/content/restore', [
            'type' => 'question', 'id' => $question->id,
        ])->assertOk();

        $this->assertEquals('published', $question->fresh()->status->value);
    }

    public function test_moderator_can_close_a_question_with_a_reason(): void
    {
        $question = Question::factory()->create();
        $moderator = User::factory()->moderator()->create();

        $this->actingAs($moderator)->postJson('/api/v1/admin/content/close', [
            'question_id' => $question->id, 'reason' => 'duplicate',
        ])->assertOk();

        $this->assertEquals('closed', $question->fresh()->status->value);
        // Closed questions remain publicly readable.
        $this->getJson("/api/v1/questions/{$question->slug}")->assertOk();
    }

    public function test_report_flow_from_submission_to_resolution(): void
    {
        $reporter = User::factory()->create();
        $question = Question::factory()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAs($reporter)->postJson('/api/v1/reports', [
            'reportable_type' => 'question',
            'reportable_id' => $question->id,
            'reason' => 'spam',
            'description' => 'This looks like spam.',
        ])->assertCreated();

        // Duplicate open report is rejected.
        $this->actingAs($reporter)->postJson('/api/v1/reports', [
            'reportable_type' => 'question',
            'reportable_id' => $question->id,
            'reason' => 'spam',
        ])->assertStatus(409);

        $report = Report::query()->firstOrFail();

        $this->actingAs($admin)->getJson('/api/v1/admin/reports?status=pending')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);

        $this->actingAs($admin)->postJson("/api/v1/admin/reports/{$report->id}/status", [
            'status' => 'resolved',
            'action' => 'hide',
            'resolution_note' => 'Confirmed spam.',
        ])->assertOk();

        $this->assertEquals('hidden', $question->fresh()->status->value);
        $this->assertEquals('resolved', $report->fresh()->status);
        $this->assertNotNull($report->fresh()->handled_by);
    }

    public function test_admin_can_suspend_and_restore_users(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$target->id}/suspend", [
            'reason' => 'Repeated harassment of community members.',
        ])->assertOk();

        $this->assertTrue($target->fresh()->is_suspended);

        $this->actingAs($admin)->postJson("/api/v1/admin/users/{$target->id}/unsuspend")->assertOk();
        $this->assertFalse($target->fresh()->is_suspended);
    }

    public function test_admin_cannot_suspend_themselves(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->postJson("/api/v1/admin/users/{$admin->id}/suspend", ['reason' => 'Self-suspend attempt.'])
            ->assertStatus(422);
    }

    public function test_admin_dashboard_returns_statistics(): void
    {
        $admin = User::factory()->admin()->create();
        Question::factory()->count(3)->create();

        $this->actingAs($admin)->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.stats.questions.published', 3);
    }
}
