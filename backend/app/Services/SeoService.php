<?php

namespace App\Services;

use App\Models\Answer;
use App\Models\Category;
use App\Models\Question;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Builds server-rendered metadata for public pages. The React SPA renders
 * the same content client-side, so structured data always mirrors what is
 * visible on the page (a hard requirement for QAPage schema).
 */
class SeoService
{
    public const SITE_NAME = 'FireShark Community';

    public const DEFAULT_DESCRIPTION = 'Ask questions. Share knowledge. Build expertise. A technical community for cybersecurity professionals, learners, ethical hackers and technology enthusiasts.';

    public function forQuestion(Question $question): array
    {
        $description = str_limit_excerpt($question->body, 300);

        return [
            'title' => $question->title,
            'description' => $description,
            'canonical' => $this->url("/questions/{$question->slug}"),
            'og_type' => 'article',
            'published_at' => $question->created_at?->toIso8601String(),
            'json_ld' => json_encode(
                $this->qaPageSchema($question),
                JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            ),
        ];
    }

    public function forCategory(Category $category): array
    {
        return [
            'title' => "{$category->name} Questions",
            'description' => Str::limit($category->description ?: "Technical questions and answers about {$category->name} in the FireShark Community.", 300),
            'canonical' => $this->url("/categories/{$category->slug}"),
            'og_type' => 'website',
        ];
    }

    public function forTag(Tag $tag): array
    {
        return [
            'title' => "{$tag->name} Questions",
            'description' => Str::limit($tag->description ?: "Questions tagged {$tag->name} in the FireShark Community.", 300),
            'canonical' => $this->url("/tags/{$tag->slug}"),
            'og_type' => 'website',
        ];
    }

    public function forUser(User $user): array
    {
        return [
            'title' => "{$user->name} (@{$user->username})",
            'description' => Str::limit($user->bio ?: "{$user->name} on the FireShark Community — {$user->reputation} reputation, {$user->questions_count} questions, {$user->answers_count} answers.", 300),
            'canonical' => $this->url("/users/{$user->username}"),
            'og_type' => 'profile',
        ];
    }

    public function forPage(string $title, string $description, string $path): array
    {
        return [
            'title' => $title,
            'description' => Str::limit($description, 300),
            'canonical' => $this->url($path),
            'og_type' => 'website',
        ];
    }

    /**
     * QAPage structured data for a question detail page, generated from the
     * same published answers the page renders.
     */
    protected function qaPageSchema(Question $question): array
    {
        $answers = $question->answers()
            ->published()
            ->with(['user:id,name,username'])
            ->orderByDesc('accepted_at')
            ->orderByDesc('votes_score')
            ->limit(50)
            ->get();

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'QAPage',
            'mainEntity' => [
                '@type' => 'Question',
                'name' => $question->title,
                'text' => $this->plainText($question->body),
                'answerCount' => $answers->count(),
                'upvoteCount' => max($question->votes_score, 0),
                'datePublished' => $question->created_at?->toIso8601String(),
                'author' => $this->authorSchema($question->user),
                'url' => $this->url("/questions/{$question->slug}"),
            ],
        ];

        if ($question->category) {
            $schema['mainEntity']['about'] = [
                '@type' => 'Thing',
                'name' => $question->category->name,
            ];
        }

        if ($answers->isNotEmpty()) {
            $schema['mainEntity']['acceptedAnswer'] = $this->answerSchema($answers->firstWhere('accepted_at', '!==', null) ?? $answers->first());

            $schema['mainEntity']['suggestedAnswer'] = $answers
                ->skip($question->accepted_answer_id ? 1 : 0)
                ->map(fn (Answer $answer) => $this->answerSchema($answer))
                ->values()
                ->all();

            if (empty($schema['mainEntity']['suggestedAnswer'])) {
                unset($schema['mainEntity']['suggestedAnswer']);
            }
        }

        return $schema;
    }

    protected function answerSchema(Answer $answer): array
    {
        return [
            '@type' => 'Answer',
            'text' => $this->plainText($answer->body),
            'datePublished' => $answer->created_at?->toIso8601String(),
            'url' => $this->url("/questions/{$answer->question->slug}#answer-{$answer->id}"),
            'author' => $this->authorSchema($answer->user),
            'upvoteCount' => max($answer->votes_score, 0),
            ...($answer->accepted_at ? ['accepted' => true] : []),
        ];
    }

    protected function authorSchema(?User $user): ?array
    {
        if (! $user) {
            return null;
        }

        return [
            '@type' => 'Person',
            'name' => $user->name,
            'url' => $this->url("/users/{$user->username}"),
        ];
    }

    protected function plainText(string $markdown): string
    {
        return str_limit_excerpt($markdown, 3000);
    }

    protected function url(string $path): string
    {
        return rtrim(config('app.url'), '/').$path;
    }
}
