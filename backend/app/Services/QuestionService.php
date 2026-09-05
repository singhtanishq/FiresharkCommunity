<?php

namespace App\Services;

use App\Enums\QuestionStatus;
use App\Models\Category;
use App\Models\Question;
use App\Models\QuestionRevision;
use App\Models\QuestionSlug;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QuestionService
{
    public function __construct(
        protected ReputationService $reputation,
        protected BadgeService $badges,
        protected MentionService $mentions,
        protected NotificationService $notifications,
    ) {
    }

    public function create(User $author, array $data, string $status = 'published'): Question
    {
        return DB::transaction(function () use ($author, $data, $status) {
            /** @var Question $question */
            $question = Question::create([
                'user_id' => $author->id,
                'category_id' => $data['category_id'],
                'title' => $data['title'],
                'slug' => $this->uniqueSlug($data['title']),
                'body' => $data['body'],
                'status' => $status,
                'last_activity_at' => now(),
            ]);

            if (! empty($data['tags'])) {
                $this->attachTags($question, $data['tags'], $author);
            }

            if ($status === QuestionStatus::Published->value) {
                Category::query()->whereKey($question->category_id)->increment('questions_count');
                $author->increment('questions_count');

                $this->reputation->award($author, 'question_posted', $question);
                $this->badges->evaluate($author);
                $this->notifyMentions($question);
            }

            return $question;
        });
    }

    public function update(Question $question, User $editor, array $data): Question
    {
        return DB::transaction(function () use ($question, $editor, $data) {
            $oldTitle = $question->title;
            $oldBody = $question->body;

            $question->fill([
                'title' => $data['title'] ?? $question->title,
                'body' => $data['body'] ?? $question->body,
                'category_id' => $data['category_id'] ?? $question->category_id,
            ]);

            if ($question->isDirty('title')) {
                $newSlug = $this->uniqueSlug($question->title, ignoreId: $question->id);
                QuestionSlug::create([
                    'question_id' => $question->id,
                    'slug' => $question->slug,
                    'created_at' => now(),
                ]);
                $question->slug = $newSlug;
            }

            if ($question->isDirty('category_id')) {
                Category::query()->whereKey($question->getOriginal('category_id'))->decrement('questions_count');
                Category::query()->whereKey($question->category_id)->increment('questions_count');
            }

            if ($question->isDirty('title') || $question->isDirty('body')) {
                QuestionRevision::create([
                    'question_id' => $question->id,
                    'editor_id' => $editor->id,
                    'old_title' => $oldTitle,
                    'new_title' => $question->title,
                    'old_body' => $oldBody,
                    'new_body' => $question->body,
                    'created_at' => now(),
                ]);
            }

            $question->save();

            if (array_key_exists('tags', $data)) {
                $question->tags()->sync($this->resolveTagIds($data['tags'] ?? [], $editor));
            }

            return $question->refresh();
        });
    }

    public function attachTags(Question $question, array $tags, User $author): void
    {
        $question->tags()->syncWithoutDetaching($this->resolveTagIds($tags, $author));
    }

    /**
     * Tags arrive as existing slugs. New tags may only be created by staff;
     * unknown slugs submitted by regular users are silently dropped.
     */
    protected function resolveTagIds(array $slugs, User $user): array
    {
        $slugs = collect($slugs)
            ->map(fn ($slug) => Str::slug((string) $slug))
            ->filter()
            ->unique()
            ->take(5)
            ->values();

        $existing = \App\Models\Tag::query()->whereIn('slug', $slugs)->get()->keyBy('slug');

        $ids = [];

        foreach ($slugs as $slug) {
            if ($existing->has($slug)) {
                $ids[] = $existing[$slug]->id;
            } elseif ($user->isStaff()) {
                $tag = \App\Models\Tag::create([
                    'name' => str_replace('-', ' ', $slug),
                    'slug' => $slug,
                    'created_by' => $user->id,
                ]);
                $ids[] = $tag->id;
            }
        }

        return $ids;
    }

    protected function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title) ?: 'question';
        $slug = $base;
        $suffix = 2;

        $query = Question::withTrashed();

        while (
            $query->clone()->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
            || QuestionSlug::query()->where('slug', $slug)->exists()
        ) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    protected function notifyMentions(Question $question): void
    {
        foreach ($this->mentions->mentionedUsers($question->body) as $mentioned) {
            $this->notifications->send(
                $mentioned,
                'mention',
                "{$question->user->name} mentioned you in \"{$question->title}\".",
                "/questions/{$question->slug}",
                $question->user
            );
        }
    }
}
