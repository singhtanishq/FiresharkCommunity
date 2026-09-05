<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AnswerResource;
use App\Http\Resources\BadgeResource;
use App\Http\Resources\QuestionResource;
use App\Models\Answer;
use App\Models\Question;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function show(string $username): JsonResponse
    {
        $user = User::query()
            ->where('username', mb_strtolower($username))
            ->with(['verifications' => fn ($q) => $q->whereNull('revoked_at')])
            ->first();

        if (! $user) {
            return $this->error('User not found.', 404);
        }

        $badges = $user->badges()->where('badges.is_active', true)->orderByPivot('created_at', 'desc')->get();

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar_path' => $user->avatar_path,
            'bio' => $user->bio,
            'expertise' => $user->expertise,
            'location' => $user->location,
            'website' => $user->website,
            'role' => $user->role->value,
            'verification' => $user->activeVerification()?->type,
            'reputation' => $user->reputation,
            'questions_count' => $user->questions_count,
            'answers_count' => $user->answers_count,
            'accepted_answers_count' => $user->accepted_answers_count,
            'badges' => BadgeResource::collection($badges)->resolve(),
            'member_since' => $user->created_at,
        ]);
    }

    public function questions(Request $request, string $username): JsonResponse
    {
        $user = User::query()->where('username', mb_strtolower($username))->firstOrFail();
        $perPage = min((int) $request->query('per_page', 15), 50);

        $questions = Question::query()
            ->publiclyVisible()
            ->where('user_id', $user->id)
            ->with(['category:id,name,slug', 'tags:id,name,slug', 'user:id,name,username,avatar_path'])
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($questions, QuestionResource::class);
    }

    public function answers(Request $request, string $username): JsonResponse
    {
        $user = User::query()->where('username', mb_strtolower($username))->firstOrFail();
        $perPage = min((int) $request->query('per_page', 15), 50);

        $answers = Answer::query()
            ->published()
            ->where('user_id', $user->id)
            ->whereHas('question', fn ($q) => $q->publiclyVisible())
            ->with([
                'user:id,name,username,avatar_path,reputation,role',
                'question:id,slug,title,is_solved,status',
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return $this->paginated($answers, AnswerResource::class);
    }
}
