<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Question;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $categories = Category::active()->get();

        return $this->success(CategoryResource::collection($categories)->resolve());
    }

    public function show(Request $request, Category $category): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 15), 50);
        $sort = $request->query('sort', 'latest');

        $base = Question::query()
            ->publiclyVisible()
            ->where('category_id', $category->id);

        $filters = [
            'latest' => fn ($q) => $q->orderByDesc('created_at'),
            'popular' => fn ($q) => $q->orderByDesc('views'),
            'most_voted' => fn ($q) => $q->orderByDesc('votes_score'),
            'unanswered' => fn ($q) => $q->where('answers_count', 0)->orderByDesc('created_at'),
        ];

        $questions = (clone $base)
            ->with(['user:id,name,username,avatar_path,reputation,role', 'tags:id,name,slug'])
            ->when($sort === 'unanswered', fn ($q) => $q->where('answers_count', 0))
            ->orderByDesc(match ($sort) {
                'popular' => 'views',
                'most_voted' => 'votes_score',
                default => 'created_at',
            })
            ->paginate($perPage)
            ->withQueryString();

        $stats = [
            'total' => (clone $base)->count(),
            'unanswered' => (clone $base)->where('answers_count', 0)->count(),
            'solved' => (clone $base)->where('is_solved', true)->count(),
        ];

        $relatedTags = \App\Models\Tag::query()
            ->select('tags.id', 'tags.name', 'tags.slug', 'tags.questions_count')
            ->join('question_tags', 'question_tags.tag_id', '=', 'tags.id')
            ->join('questions', 'questions.id', '=', 'question_tags.question_id')
            ->where('questions.category_id', $category->id)
            ->where('questions.status', 'published')
            ->groupBy('tags.id', 'tags.name', 'tags.slug', 'tags.questions_count')
            ->orderByDesc('tags.questions_count')
            ->limit(12)
            ->get();

        return $this->success([
            'category' => (new CategoryResource($category))->resolve(),
            'stats' => $stats,
            'related_tags' => $relatedTags,
            'questions' => [
                'data' => \App\Http\Resources\QuestionResource::collection($questions->items())->resolve(),
                'meta' => [
                    'current_page' => $questions->currentPage(),
                    'last_page' => $questions->lastPage(),
                    'per_page' => $questions->perPage(),
                    'total' => $questions->total(),
                ],
            ],
        ]);
    }
}
