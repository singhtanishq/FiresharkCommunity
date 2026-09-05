<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Question;
use App\Services\VoteService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VoteController extends Controller
{
    use ApiResponse;

    public function __construct(protected VoteService $votes)
    {
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'votable_type' => ['required', Rule::in(['question', 'answer'])],
            'votable_id' => ['required', 'integer'],
            'value' => ['required', 'integer', Rule::in([1, -1])],
        ]);

        /** @var Question|Answer $votable */
        $votable = match ($data['votable_type']) {
            'question' => Question::publiclyVisible()->findOrFail($data['votable_id']),
            'answer' => Answer::published()->whereHas('question', fn ($q) => $q->publiclyVisible())->findOrFail($data['votable_id']),
        };

        $this->authorize('vote', $votable);

        try {
            $myVote = $this->votes->vote($request->user(), $votable, $data['value']);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }

        $votable->refresh();

        return $this->success([
            'my_vote' => $myVote,
            'votes_score' => $votable->votes_score,
        ], $myVote === 0 ? 'Vote removed.' : 'Vote recorded.');
    }
}
