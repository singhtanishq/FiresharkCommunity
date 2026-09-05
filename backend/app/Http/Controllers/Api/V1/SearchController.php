<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Services\SearchService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    use ApiResponse;

    public function __construct(protected SearchService $search)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $term = (string) $request->query('q', '');

        if (mb_strlen(trim($term)) < config('community.search.min_term_length')) {
            return $this->success([
                'query' => $term,
                'data' => [],
                'meta' => ['current_page' => 1, 'last_page' => 1, 'per_page' => 15, 'total' => 0],
            ]);
        }

        $perPage = min((int) $request->query('per_page', 15), 50);

        $filters = [];
        if ($request->filled('category_id')) {
            $filters['category_id'] = (int) $request->query('category_id');
        }
        if ($request->filled('tag_id')) {
            $filters['tag_id'] = (int) $request->query('tag_id');
        }

        $results = $this->search->searchQuestions(
            $term,
            $filters,
            (string) $request->query('sort', 'relevance'),
            $perPage,
        );

        return $this->success([
            'query' => $term,
            'data' => QuestionResource::collection($results->items())->resolve(),
            'meta' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
        ]);
    }
}
