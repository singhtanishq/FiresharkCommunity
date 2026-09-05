<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Comment;
use App\Models\Question;
use App\Models\Report;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $monthStart = now()->startOfMonth();

        $stats = [
            'users' => [
                'total' => User::query()->count(),
                'active_month' => User::query()->where('last_activity_at', '>=', $monthStart)->count(),
                'suspended' => User::query()->where('is_suspended', true)->count(),
                'staff' => User::query()->staff()->count(),
            ],
            'questions' => [
                'total' => Question::query()->count(),
                'published' => Question::query()->publiclyVisible()->count(),
                'pending' => Question::query()->where('status', 'pending')->count(),
                'hidden' => Question::query()->where('status', 'hidden')->count(),
                'unanswered' => Question::query()->publiclyVisible()->where('answers_count', 0)->count(),
                'solved' => Question::query()->publiclyVisible()->where('is_solved', true)->count(),
                'new_month' => Question::query()->where('created_at', '>=', $monthStart)->count(),
            ],
            'answers' => [
                'total' => Answer::query()->count(),
                'new_month' => Answer::query()->where('created_at', '>=', $monthStart)->count(),
            ],
            'comments' => [
                'total' => Comment::query()->count(),
            ],
            'reports' => [
                'pending' => Report::query()->where('status', 'pending')->count(),
                'reviewing' => Report::query()->where('status', 'reviewing')->count(),
                'total' => Report::query()->count(),
            ],
            'categories' => \App\Models\Category::query()->count(),
            'tags' => \App\Models\Tag::query()->count(),
        ];

        $recentActivity = [
            'questions' => Question::query()->with('user:id,name,username')->latest()->limit(8)->get(['id', 'title', 'slug', 'status', 'user_id', 'created_at']),
            'reports' => Report::query()->with('reporter:id,name,username')->latest()->limit(8)->get(['id', 'reason', 'status', 'reportable_type', 'reportable_id', 'reporter_id', 'created_at']),
        ];

        return $this->success([
            'stats' => $stats,
            'recent_activity' => $recentActivity,
        ]);
    }
}
