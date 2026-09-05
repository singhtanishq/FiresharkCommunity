<?php

namespace App\Services;

use App\Models\Question;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * MySQL-backed search. Uses InnoDB full-text matching on question title and
 * body with a LIKE fallback for very short or non-matching queries. The
 * interface is intentionally narrow so a dedicated search engine can replace
 * it later without touching controllers.
 */
class SearchService
{
    public function searchQuestions(string $term, array $filters = [], string $sort = 'relevance', int $perPage = 15): LengthAwarePaginator
    {
        $term = trim($term);

        if ($term === '') {
            return Question::query()->whereRaw('1 = 0')->paginate($perPage);
        }

        $query = Question::query()
            ->publiclyVisible()
            ->with(['user:id,name,username,avatar_path', 'category:id,name,slug', 'tags:id,name,slug']);

        // Full-text scoring against title (weighted) and body.
        $query->selectRaw('questions.*, MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance', [$term])
            ->whereRaw('MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE)', [$term]);

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['tag_id'])) {
            $query->whereHas('tags', fn ($q) => $q->where('tags.id', $filters['tag_id']));
        }

        match ($sort) {
            'latest' => $query->orderByDesc('created_at'),
            'votes' => $query->orderByDesc('votes_score'),
            'answers' => $query->orderByDesc('answers_count'),
            'views' => $query->orderByDesc('views'),
            default => $query->orderByDesc('relevance'),
        };

        $results = $query->paginate($perPage);

        // Full-text tokenisation can miss short terms (min token length 3) —
        // fall back to LIKE so the user always gets useful results.
        if ($results->total() === 0 && mb_strlen($term) >= 2) {
            return $this->likeFallback($term, $filters, $sort, $perPage);
        }

        return $results;
    }

    protected function likeFallback(string $term, array $filters, string $sort, int $perPage): LengthAwarePaginator
    {
        // Match any individual word so multi-word queries degrade gracefully.
        $words = preg_split('/\s+/', $term, -1, PREG_SPLIT_NO_EMPTY);
        $words = array_slice($words, 0, 6);

        $query = Question::query()
            ->publiclyVisible()
            ->with(['user:id,name,username,avatar_path', 'category:id,name,slug', 'tags:id,name,slug'])
            ->where(function ($outer) use ($words) {
                foreach ($words as $word) {
                    $like = '%'.str_replace(['%', '_'], ['\%', '\_'], mb_strtolower($word)).'%';

                    $outer->orWhere(function ($inner) use ($like) {
                        $inner->whereRaw('LOWER(title) LIKE ?', [$like])
                            ->orWhereRaw('LOWER(body) LIKE ?', [$like]);
                    });
                }
            });

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (! empty($filters['tag_id'])) {
            $query->whereHas('tags', fn ($q) => $q->where('tags.id', $filters['tag_id']));
        }

        match ($sort) {
            'latest' => $query->orderByDesc('created_at'),
            'votes' => $query->orderByDesc('votes_score'),
            default => $query->orderByDesc('created_at'),
        };

        return $query->paginate($perPage);
    }

    /**
     * Tag autocomplete for the ask-question form.
     */
    public function suggestTags(string $term, int $limit = 8): array
    {
        $term = trim($term);

        if ($term === '') {
            return [];
        }

        return DB::table('tags')
            ->where('name', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%')
            ->orderByDesc('questions_count')
            ->limit($limit)
            ->get(['id', 'name', 'slug', 'questions_count'])
            ->toArray();
    }
}
