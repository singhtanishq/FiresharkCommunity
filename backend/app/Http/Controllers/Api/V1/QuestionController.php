<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionRequest;
use App\Http\Requests\UpdateQuestionRequest;
use App\Http\Resources\AnswerResource;
use App\Http\Resources\QuestionResource;
use App\Models\Bookmark;
use App\Models\Question;
use App\Models\QuestionFollower;
use App\Models\QuestionSlug;
use App\Services\AnswerService;
use App\Services\QuestionService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class QuestionController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected QuestionService $questions,
        protected AnswerService $answers,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 15), 50);

        $query = Question::query()
            ->visibleTo($request->user())
            ->with([
                'user:id,name,username,avatar_path,reputation,role',
                'category:id,name,slug',
                'tags:id,name,slug',
            ])
            ->withCount(['followers']);

        // Authorise per-viewer vote/bookmark state in a single extra query.
        if ($request->user()) {
            $query->withCount(['votes as my_vote_query'])
                ->addSelect(['my_vote' => fn ($q) => $q
                    ->select('value')
                    ->from('votes')
                    ->whereColumn('votable_id', 'questions.id')
                    ->where('votable_type', 'question')
                    ->where('user_id', $request->user()->id)
                    ->limit(1)]);
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->query('category')));
        }

        if ($request->filled('tag')) {
            $query->whereHas('tags', fn ($q) => $q->where('tags.slug', $request->query('tag')));
        }

        if ($request->filled('author')) {
            $query->whereHas('user', fn ($q) => $q->where('username', $request->query('author')));
        }

        if ($request->boolean('unanswered')) {
            $query->where('answers_count', 0);
        }

        if ($request->boolean('solved')) {
            $query->where('is_solved', true);
        }

        match ($request->query('sort', 'latest')) {
            'most_answered' => $query->orderByDesc('answers_count'),
            'most_viewed' => $query->orderByDesc('views'),
            'most_voted' => $query->orderByDesc('votes_score'),
            'unanswered' => $query->orderByDesc('created_at'),
            'activity' => $query->orderByDesc('last_activity_at'),
            default => $query->orderByDesc('created_at'),
        };

        return $this->paginated(
            $query->paginate($perPage)->withQueryString(),
            QuestionResource::class,
        );
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $question = Question::withTrashed()->where('slug', $slug)->first();

        if (! $question) {
            // Old slug? 301 to the current one so indexed URLs never break.
            $redirect = QuestionSlug::query()->where('slug', $slug)->first();

            if ($redirect && $redirect->question()->exists()) {
                return $this->success([
                    'redirect' => true,
                    'to' => '/questions/'.$redirect->question->slug,
                ]);
            }

            return $this->error('Question not found.', 404);
        }

        $viewer = $request->user();
        $visible = $question->status->isPubliclyVisible()
            || ($viewer && ($viewer->isStaff() || $question->user_id === $viewer->id));

        if ($question->trashed() || ! $visible) {
            return $this->error('Question not found.', 404);
        }

        $question->load([
            'user:id,name,username,avatar_path,reputation,role,created_at',
            'user.verifications' => fn ($q) => $q->whereNull('revoked_at'),
            'category:id,name,slug',
            'tags:id,name,slug',
            'acceptedAnswer:id,question_id,accepted_at',
        ]);

        if ($request->user()) {
            $question->my_vote = $question->votes()->where('user_id', $request->user()->id)->value('value') ?? 0;
            $question->bookmarked = $request->user()->bookmarks()->where('question_id', $question->id)->exists();
            $question->following = $question->followers()->where('users.id', $request->user()->id)->exists();
        }

        $this->recordView($request, $question);

        return $this->success(new QuestionResource($question));
    }

    public function store(StoreQuestionRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->markActivity();

        $status = $request->input('status', 'published') === 'draft' ? 'draft' : 'published';

        $question = $this->questions->create($user, $request->validated(), $status);

        return $this->success(
            new QuestionResource($question->load(['user', 'category', 'tags'])),
            $status === 'draft' ? 'Draft saved.' : 'Question published.',
            201
        );
    }

    public function update(UpdateQuestionRequest $request, Question $question): JsonResponse
    {
        $this->authorize('update', $question);

        $question = $this->questions->update($question, $request->user(), $request->validated());

        return $this->success(
            new QuestionResource($question->load(['user', 'category', 'tags'])),
            'Question updated.'
        );
    }

    public function destroy(Request $request, Question $question): JsonResponse
    {
        $this->authorize('delete', $question);

        $user = $request->user();

        if ($user->isStaff()) {
            app(\App\Services\ModerationService::class)->delete($question, $user, 'Deleted via API');
        } else {
            // Author self-delete: simple soft delete, votes stay attached to
            // the soft-deleted content and reputation is rolled back.
            app(\App\Services\ModerationService::class)->delete($question, $user, 'Author deleted own question');
        }

        return $this->success(null, 'Question deleted.');
    }

    // ------------------------------------------------------------------
    // Answers nested under questions
    // ------------------------------------------------------------------

    public function answers(Request $request, Question $question): JsonResponse
    {
        $sort = $request->query('sort', 'votes');

        $query = $question->answers()
            ->published()
            ->with([
                'user:id,name,username,avatar_path,reputation,role',
                'user.verifications' => fn ($q) => $q->whereNull('revoked_at'),
                'comments' => fn ($q) => $q->published()->with('user:id,name,username,avatar_path,reputation,role'),
            ]);

        if ($request->user()) {
            $query->addSelect(['my_vote' => fn ($q) => $q
                ->select('value')
                ->from('votes')
                ->whereColumn('votable_id', 'answers.id')
                ->where('votable_type', 'answer')
                ->where('user_id', $request->user()->id)
                ->limit(1)]);
        }

        match ($sort) {
            'oldest' => $query->orderBy('created_at'),
            'newest' => $query->orderByDesc('created_at'),
            default => $query->orderByDesc('accepted_at')->orderByDesc('votes_score')->orderBy('created_at'),
        };

        $answers = $query->get();

        $acceptedId = $question->accepted_answer_id;

        $payload = $answers->map(function ($answer) use ($acceptedId) {
            $resource = (new AnswerResource($answer))->resolve();
            $resource['accepted'] = $answer->id === $acceptedId || $answer->accepted_at !== null;

            return $resource;
        });

        return $this->success($payload);
    }

    public function storeAnswer(\App\Http\Requests\StoreAnswerRequest $request, Question $question): JsonResponse
    {
        $this->authorize('answer', $question);

        $user = $request->user();
        $user->markActivity();

        $answer = $this->answers->create($question, $user, $request->input('body'));

        return $this->success(
            (new AnswerResource($answer->load('user')))->resolve(),
            'Answer posted.',
            201
        );
    }

    // ------------------------------------------------------------------
    // Bookmarks & follow
    // ------------------------------------------------------------------

    public function toggleBookmark(Request $request, Question $question): JsonResponse
    {
        $exists = Bookmark::query()
            ->where('user_id', $request->user()->id)
            ->where('question_id', $question->id)
            ->exists();

        if ($exists) {
            Bookmark::query()
                ->where('user_id', $request->user()->id)
                ->where('question_id', $question->id)
                ->delete();

            return $this->success(['bookmarked' => false], 'Bookmark removed.');
        }

        Bookmark::create([
            'user_id' => $request->user()->id,
            'question_id' => $question->id,
        ]);

        return $this->success(['bookmarked' => true], 'Question bookmarked.');
    }

    public function toggleFollow(Request $request, Question $question): JsonResponse
    {
        $exists = QuestionFollower::query()
            ->where('user_id', $request->user()->id)
            ->where('question_id', $question->id)
            ->exists();

        if ($exists) {
            QuestionFollower::query()
                ->where('user_id', $request->user()->id)
                ->where('question_id', $question->id)
                ->delete();

            return $this->success(['following' => false], 'Unfollowed question.');
        }

        QuestionFollower::create([
            'user_id' => $request->user()->id,
            'question_id' => $question->id,
        ]);

        return $this->success(['following' => true], 'Following question.');
    }

    protected function recordView(Request $request, Question $question): void
    {
        $key = 'qview:'.sha1($question->id.'|'.($request->user()?->id ?? $request->ip()));

        // Count at most one view per visitor per hour.
        if (Cache::add($key, true, ttl: 3600)) {
            Question::withoutTimestamps(fn () => $question->increment('views'));
        }
    }
}
