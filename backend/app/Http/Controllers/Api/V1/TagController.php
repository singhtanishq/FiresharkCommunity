<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Http\Resources\TagResource;
use App\Models\Question;
use App\Models\Tag;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 24), 100);

        $tags = Tag::query()
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.$request->query('q').'%'))
            ->orderByDesc('questions_count')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($tags, TagResource::class);
    }

    public function show(Request $request, Tag $tag): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 15), 50);

        $questions = Question::query()
            ->publiclyVisible()
            ->whereHas('tags', fn ($q) => $q->where('tags.id', $tag->id))
            ->with(['user:id,name,username,avatar_path,reputation,role', 'category:id,name,slug', 'tags:id,name,slug'])
            ->when($request->query('sort') === 'votes', fn ($q) => $q->orderByDesc('votes_score'))
            ->when(! in_array($request->query('sort'), ['votes'], true), fn ($q) => $q->orderByDesc('created_at'))
            ->paginate($perPage)
            ->withQueryString();

        return $this->success([
            'tag' => (new TagResource($tag))->resolve(),
            'questions' => [
                'data' => QuestionResource::collection($questions->items())->resolve(),
                'meta' => [
                    'current_page' => $questions->currentPage(),
                    'last_page' => $questions->lastPage(),
                    'per_page' => $questions->perPage(),
                    'total' => $questions->total(),
                ],
            ],
        ]);
    }

    /**
     * Autocomplete endpoint used by the ask-question tag selector.
     */
    public function suggest(Request $request): JsonResponse
    {
        $term = (string) $request->query('q', '');

        $tags = app(\App\Services\SearchService::class)->suggestTags($term);

        return $this->success($tags);
    }
}
