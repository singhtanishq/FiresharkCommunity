<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Answer;
use App\Models\Comment;
use App\Models\Question;
use App\Services\CommentService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CommentController extends Controller
{
    use ApiResponse;

    public function __construct(protected CommentService $comments)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'commentable_type' => ['required', Rule::in(['question', 'answer'])],
            'commentable_id' => ['required', 'integer'],
        ]);

        $comments = Comment::query()
            ->published()
            ->where('commentable_type', $data['commentable_type'])
            ->where('commentable_id', $data['commentable_id'])
            ->with('user:id,name,username,avatar_path,reputation,role')
            ->orderBy('created_at')
            ->get();

        return $this->success(CommentResource::collection($comments)->resolve());
    }

    public function store(StoreCommentRequest $request): JsonResponse
    {
        $data = $request->validate([
            'commentable_type' => ['required', Rule::in(['question', 'answer'])],
            'commentable_id' => ['required', 'integer'],
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ]);

        /** @var Question|Answer $commentable */
        $commentable = match ($data['commentable_type']) {
            'question' => Question::publiclyVisible()->findOrFail($data['commentable_id']),
            'answer' => Answer::published()->whereHas('question', fn ($q) => $q->publiclyVisible())->findOrFail($data['commentable_id']),
        };

        $user = $request->user();
        $user->markActivity();

        $comment = $this->comments->create($commentable, $user, $data['body']);

        return $this->success(
            (new CommentResource($comment->load('user')))->resolve(),
            'Comment posted.',
            201
        );
    }

    public function update(StoreCommentRequest $request, Comment $comment): JsonResponse
    {
        $this->authorize('update', $comment);

        $comment->update(['body' => $request->input('body')]);

        return $this->success(
            (new CommentResource($comment->load('user')))->resolve(),
            'Comment updated.'
        );
    }

    public function destroy(Request $request, Comment $comment): JsonResponse
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return $this->success(null, 'Comment deleted.');
    }
}
