<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAnswerRequest;
use App\Http\Resources\AnswerResource;
use App\Models\Answer;
use App\Services\AnswerService;
use App\Services\ModerationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnswerController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AnswerService $answers,
        protected ModerationService $moderation,
    ) {
    }

    public function update(StoreAnswerRequest $request, Answer $answer): JsonResponse
    {
        $this->authorize('update', $answer);

        $answer->update(['body' => $request->input('body')]);

        return $this->success(
            (new AnswerResource($answer->load('user')))->resolve(),
            'Answer updated.'
        );
    }

    public function destroy(Request $request, Answer $answer): JsonResponse
    {
        $this->authorize('delete', $answer);

        $this->moderation->delete($answer, $request->user(), 'Answer deleted');

        return $this->success(null, 'Answer deleted.');
    }

    public function accept(Request $request, Answer $answer): JsonResponse
    {
        $question = $answer->question;

        $this->authorize('acceptAnswer', $question);

        $this->answers->accept($question, $answer, $request->user());

        return $this->success(null, 'Answer accepted.');
    }

    public function unaccept(Request $request, Answer $answer): JsonResponse
    {
        $question = $answer->question;

        $this->authorize('acceptAnswer', $question);

        $this->answers->unaccept($question, $request->user());

        return $this->success(null, 'Answer acceptance removed.');
    }
}
