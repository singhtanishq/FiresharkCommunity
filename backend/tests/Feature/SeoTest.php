<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Question;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoTest extends TestCase
{
    use RefreshDatabase;

    public function test_question_page_renders_title_canonical_and_qapage_schema(): void
    {
        $user = User::factory()->create(['name' => 'Tanishq Singh']);
        $question = Question::factory()->create([
            'user_id' => $user->id,
            'title' => 'How do I secure an exposed SSH service?',
        ]);

        \App\Models\Answer::create([
            'question_id' => $question->id,
            'user_id' => User::factory()->create()->id,
            'body' => 'Disable password authentication and use keys.',
        ]);

        $html = $this->get('/questions/'.$question->slug)
            ->assertOk()
            ->getContent();

        $this->assertStringContainsString('<title>How do I secure an exposed SSH service?</title>', $html);
        $this->assertStringContainsString('rel="canonical"', $html);
        $this->assertStringContainsString('"@type":"QAPage"', $html);
        $this->assertStringContainsString('Disable password authentication and use keys.', $html);
        $this->assertStringContainsString('property="og:title"', $html);
    }

    public function test_hidden_questions_are_not_rendered(): void
    {
        $question = Question::factory()->create(['status' => 'hidden']);

        $this->get('/questions/'.$question->slug)->assertNotFound();
    }

    public function test_private_pages_are_noindex(): void
    {
        $this->get('/login')->assertOk()->assertSee('noindex', false);
        $this->get('/settings')->assertOk()->assertSee('noindex', false);
    }

    public function test_sitemap_includes_public_questions_categories_and_tags(): void
    {
        $visible = Question::factory()->create();
        $category = Category::factory()->create();

        $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('/questions/'.$visible->slug, $xml);
        $this->assertStringContainsString('/categories/'.$category->slug, $xml);
    }

    public function test_sitemap_does_not_leak_hidden_questions(): void
    {
        $hidden = Question::factory()->create(['status' => 'hidden']);
        $published = Question::factory()->create();

        $xml = $this->get('/sitemap.xml')->getContent();

        $this->assertStringContainsString($published->slug, $xml);
        $this->assertStringNotContainsString($hidden->slug, $xml);
    }
}
