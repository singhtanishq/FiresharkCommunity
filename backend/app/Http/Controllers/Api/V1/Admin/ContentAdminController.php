<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\QuestionStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\QuestionResource;
use App\Models\Answer;
use App\Models\Comment;
use App\Models\Question;
use App\Services\ModerationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Moderation endpoints over all content regardless of status.
 */
class ContentAdminController extends Controller
{
    use ApiResponse;

    public function __construct(protected ModerationService $moderation)
    {
    }

    public function questions(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        $questions = Question::query()
            ->with(['user:id,name,username,avatar_path', 'category:id,name,slug'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->filled('q'), fn ($q) => $q->where('title', 'like', '%'.$request->query('q').'%'))
            ->when($request->boolean('trashed'), fn ($q) => $q->onlyTrashed())
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated(QuestionResource::collection($questions));
    }

    public function answers(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        $answers = Answer::query()
            ->with(['user:id,name,username,avatar_path', 'question:id,slug,title,status'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->when($request->boolean('trashed'), fn ($q) => $q->onlyTrashed())
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($answers->through(fn ($answer) => [
            'id' => $answer->id,
            'excerpt' => str_limit_excerpt($answer->body, 200),
            'status' => $answer->status,
            'votes_score' => $answer->votes_score,
            'accepted_at' => $answer->accepted_at,
            'created_at' => $answer->created_at,
            'user' => $answer->user ? ['name' => $answer->user->name, 'username' => $answer->user->username] : null,
            'question' => $answer->question ? ['id' => $answer->question->id, 'slug' => $answer->question->slug, 'title' => $answer->question->title] : null,
        ]));
    }

    public function comments(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 20), 100);

        $comments = Comment::query()
            ->with(['user:id,name,username,avatar_path'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($comments->through(fn ($comment) => [
            'id' => $comment->id,
            'body' => $comment->body,
            'status' => $comment->status,
            'commentable_type' => $comment->commentable_type,
            'commentable_id' => $comment->commentable_id,
            'created_at' => $comment->created_at,
            'user' => $comment->user ? ['name' => $comment->user->name, 'username' => $comment->user->username] : null,
        ]));
    }

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------

    public function hide(Request $request): JsonResponse
    {
        [$content, $type] = $this->resolveContent($request);

        $this->moderation->hide($content, $request->user(), $request->input('reason'));

        return $this->success(null, ucfirst($type).' hidden.');
    }

    public function restore(Request $request): JsonResponse
    {
        [$content, $type] = $this->resolveContent($request);

        if ($content instanceof Question) {
            $this->moderation->restore($content, $request->user(), $request->input('reason'));
        } else {
            $content->forceFill(['status' => 'published'])->saveQuietly();
            $this->moderation->log($request->user(), 'restore', $content, $request->input('reason'));
        }

        return $this->success(null, ucfirst($type).' restored.');
    }

    public function close(Request $request): JsonResponse
    {
        $data = $request->validate([
            'question_id' => ['required', 'integer'],
            'reason' => ['required', Rule::in(['duplicate', 'too_broad', 'unclear', 'off_topic', 'requires_support', 'violates_guidelines', 'other'])],
            'reason_note' => ['nullable', 'string', 'max:500'],
        ]);

        $question = Question::findOrFail($data['question_id']);

        $this->moderation->close($question, $request->user(), $data['reason_note'] ?? $data['reason']);

        return $this->success(null, 'Question closed.');
    }

    public function reopen(Request $request): JsonResponse
    {
        $data = $request->validate(['question_id' => ['required', 'integer']]);
        $question = Question::findOrFail($data['question_id']);

        $this->moderation->reopen($question, $request->user());

        return $this->success(null, 'Question reopened.');
    }

    public function delete(Request $request): JsonResponse
    {
        [$content, $type] = $this->resolveContent($request);

        $this->moderation->delete($content, $request->user(), $request->input('reason', 'Deleted by moderation'));

        return $this->success(null, ucfirst($type).' deleted.');
    }

    public function restoreDeleted(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['question', 'answer', 'comment'])],
            'id' => ['required', 'integer'],
        ]);

        $class = match ($data['type']) {
            'question' => Question::class,
            'answer' => Answer::class,
            'comment' => Comment::class,
        };

        $content = $class::onlyTrashed()->findOrFail($data['id']);
        $content->restore();

        $this->moderation->log($request->user(), 'restore_deleted', $content);

        return $this->success(null, ucfirst($data['type']).' restored from deletion.');
    }

    protected function resolveContent(Request $request): array
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['question', 'answer', 'comment'])],
            'id' => ['required', 'integer'],
        ]);

        $content = match ($data['type']) {
            'question' => Question::findOrFail($data['id']),
            'answer' => Answer::findOrFail($data['id']),
            'comment' => Comment::findOrFail($data['id']),
        };

        return [$content, $data['type']];
    }
}
