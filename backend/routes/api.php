<?php

use App\Http\Controllers\Api\V1\Admin\CategoryAdminController;
use App\Http\Controllers\Api\V1\Admin\ContentAdminController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\GamificationAdminController;
use App\Http\Controllers\Api\V1\Admin\ReportAdminController;
use App\Http\Controllers\Api\V1\Admin\SettingsAdminController;
use App\Http\Controllers\Api\V1\Admin\TagAdminController;
use App\Http\Controllers\Api\V1\Admin\UserAdminController;
use App\Http\Controllers\Api\V1\AnswerController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\VerifyEmailController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CommentController;
use App\Http\Controllers\Api\V1\LeaderboardController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\QuestionController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\TagController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VoteController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ------------------------------------------------------------------
    // Authentication
    // ------------------------------------------------------------------

    Route::middleware('throttle:auth')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/forgot-password', [PasswordResetController::class, 'forgot']);
        Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);
    });

    Route::post('/auth/logout', [AuthController::class, 'logout'])
        ->middleware('auth:sanctum');

    Route::get('/auth/me', [AuthController::class, 'me'])
        ->middleware('auth:sanctum');

    // Signed email-verification completion, forwarded by the SPA.
    Route::get('/auth/email/verify/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['auth:sanctum', 'signed'])
        ->name('verification.verify');

    Route::post('/auth/email/verification-notification', [VerifyEmailController::class, 'resend'])
        ->middleware(['auth:sanctum', 'throttle:auth']);

    // ------------------------------------------------------------------
    // Public content
    // ------------------------------------------------------------------

    Route::get('/questions', [QuestionController::class, 'index'])->name('questions.index');
    // Specific sub-routes must be registered before the free-form slug route.
    Route::get('/questions/{question}/answers', [QuestionController::class, 'answers'])->whereNumber('question')->name('questions.answers');
    Route::get('/questions/{slug}', [QuestionController::class, 'show'])->where('slug', '.*')->name('questions.show');
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}', [CategoryController::class, 'show']);
    Route::get('/tags', [TagController::class, 'index']);
    Route::get('/tags/suggest', [TagController::class, 'suggest']);
    Route::get('/tags/{tag}', [TagController::class, 'show']);
    Route::get('/search', SearchController::class)->middleware('throttle:search');
    Route::get('/users/{username}', [UserController::class, 'show']);
    Route::get('/users/{username}/questions', [UserController::class, 'questions']);
    Route::get('/users/{username}/answers', [UserController::class, 'answers']);
    Route::get('/leaderboard', [LeaderboardController::class, 'index']);
    Route::get('/badges', [GamificationAdminController::class, 'publicBadges']);

    // ------------------------------------------------------------------
    // Authenticated member routes
    // ------------------------------------------------------------------

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->whereNumber('id');
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

        Route::get('/me/bookmarks', [ProfileController::class, 'bookmarks']);
        Route::patch('/me/profile', [ProfileController::class, 'update']);
        Route::post('/me/avatar', [ProfileController::class, 'updateAvatar']);
        Route::put('/me/password', [ProfileController::class, 'updatePassword']);
        Route::delete('/me/account', [ProfileController::class, 'destroy']);

        // Media uploads share the write throttle with content creation.
        Route::post('/media', [MediaController::class, 'store'])->middleware(['verified.api', 'throttle:write']);

        Route::post('/reports', [ReportController::class, 'store'])->middleware(['verified.api', 'throttle:reports']);

        // ------------------------------------------------------------------
        // Content creation / modification
        // ------------------------------------------------------------------

        Route::middleware(['verified.api', 'throttle:write'])->group(function () {
            Route::post('/questions', [QuestionController::class, 'store']);
            Route::put('/questions/{question}', [QuestionController::class, 'update'])->whereNumber('question');
            Route::delete('/questions/{question}', [QuestionController::class, 'destroy'])->whereNumber('question');
            Route::post('/questions/{question}/answers', [QuestionController::class, 'storeAnswer'])->whereNumber('question');
            Route::post('/questions/{question}/bookmark', [QuestionController::class, 'toggleBookmark'])->whereNumber('question');
            Route::post('/questions/{question}/follow', [QuestionController::class, 'toggleFollow'])->whereNumber('question');

            Route::put('/answers/{answer}', [AnswerController::class, 'update'])->whereNumber('answer');
            Route::delete('/answers/{answer}', [AnswerController::class, 'destroy'])->whereNumber('answer');
            Route::post('/answers/{answer}/accept', [AnswerController::class, 'accept'])->whereNumber('answer');
            Route::post('/answers/{answer}/unaccept', [AnswerController::class, 'unaccept'])->whereNumber('answer');

            Route::get('/comments', [CommentController::class, 'index']);
            Route::post('/comments', [CommentController::class, 'store']);
            Route::put('/comments/{comment}', [CommentController::class, 'update'])->whereNumber('comment');
            Route::delete('/comments/{comment}', [CommentController::class, 'destroy'])->whereNumber('comment');

            Route::post('/votes', [VoteController::class, 'store']);
        });
    });

    // ------------------------------------------------------------------
    // Admin & moderation
    // ------------------------------------------------------------------

    Route::prefix('admin')
        ->middleware(['auth:sanctum', 'role:moderator,admin'])
        ->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);

            // Moderation over content.
            Route::get('/questions', [ContentAdminController::class, 'questions']);
            Route::get('/answers', [ContentAdminController::class, 'answers']);
            Route::get('/comments', [ContentAdminController::class, 'comments']);
            Route::post('/content/hide', [ContentAdminController::class, 'hide']);
            Route::post('/content/restore', [ContentAdminController::class, 'restore']);
            Route::post('/content/close', [ContentAdminController::class, 'close']);
            Route::post('/content/reopen', [ContentAdminController::class, 'reopen']);
            Route::post('/content/delete', [ContentAdminController::class, 'delete']);
            Route::post('/content/restore-deleted', [ContentAdminController::class, 'restoreDeleted']);

            // Reports.
            Route::get('/reports', [ReportAdminController::class, 'index']);
            Route::post('/reports/{report}/status', [ReportAdminController::class, 'updateStatus'])->whereNumber('report');

            // Users: read for moderators, mutations for admins.
            Route::get('/users', [UserAdminController::class, 'index']);
            Route::middleware('role:admin')->group(function () {
                Route::post('/users/{user}/role', [UserAdminController::class, 'updateRole'])->whereNumber('user');
                Route::post('/users/{user}/verify', [UserAdminController::class, 'verify'])->whereNumber('user');
                Route::post('/users/{user}/revoke-verification', [UserAdminController::class, 'revokeVerification'])->whereNumber('user');
                Route::post('/users/{user}/suspend', [UserAdminController::class, 'suspend'])->whereNumber('user');
                Route::post('/users/{user}/unsuspend', [UserAdminController::class, 'unsuspend'])->whereNumber('user');

                // Categories & tags management.
                Route::post('/categories', [CategoryAdminController::class, 'store']);
                Route::put('/categories/{category}', [CategoryAdminController::class, 'update'])->whereNumber('category');
                Route::delete('/categories/{category}', [CategoryAdminController::class, 'destroy'])->whereNumber('category');
                Route::post('/categories/reorder', [CategoryAdminController::class, 'reorder']);

                Route::get('/tags', [TagAdminController::class, 'index']);
                Route::post('/tags', [TagAdminController::class, 'store']);
                Route::put('/tags/{tag}', [TagAdminController::class, 'update'])->whereNumber('tag');
                Route::delete('/tags/{tag}', [TagAdminController::class, 'destroy'])->whereNumber('tag');
                Route::post('/tags/{tag}/merge', [TagAdminController::class, 'merge'])->whereNumber('tag');

                // Badges & reputation.
                Route::get('/badges', [GamificationAdminController::class, 'badgesIndex']);
                Route::post('/badges', [GamificationAdminController::class, 'badgesStore']);
                Route::put('/badges/{badge}', [GamificationAdminController::class, 'badgesUpdate'])->whereNumber('badge');
                Route::delete('/badges/{badge}', [GamificationAdminController::class, 'badgesDestroy'])->whereNumber('badge');
                Route::post('/badges/{badge}/award', [GamificationAdminController::class, 'award'])->whereNumber('badge');
                Route::get('/reputation-rules', [GamificationAdminController::class, 'reputationRules']);
                Route::put('/reputation-rules/{rule}', [GamificationAdminController::class, 'reputationRuleUpdate'])->whereNumber('rule');

                // Settings & leaderboard.
                Route::get('/settings', [SettingsAdminController::class, 'index']);
                Route::put('/settings', [SettingsAdminController::class, 'update']);
                Route::get('/leaderboard', [SettingsAdminController::class, 'leaderboardIndex']);
                Route::post('/leaderboard/finalize', [SettingsAdminController::class, 'leaderboardFinalize']);
            });
        });
});
