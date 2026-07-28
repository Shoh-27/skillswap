<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\SkillController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ConnectionController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\SessionController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\GroupSessionController;
use App\Http\Controllers\API\ResourceController;
use App\Http\Controllers\API\ProgressController;
use App\Http\Controllers\API\AIMatchingController;
use App\Http\Controllers\API\CampusController;
use App\Http\Controllers\API\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\API\Admin\UserController as AdminUserController;
use App\Http\Controllers\API\Admin\SkillController as AdminSkillController;
use App\Http\Controllers\API\Admin\SessionController as AdminSessionController;
use App\Http\Controllers\API\Admin\GroupSessionController as AdminGroupSessionController;
use App\Http\Controllers\API\Admin\ReviewController as AdminReviewController;

Route::prefix('v1')->group(function () {

    // ── Public ───────────────────────────────────────────────────────────
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login',    [AuthController::class, 'login']);
    Route::get('skills',         [SkillController::class, 'index']);

    // ── Protected ─────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me',      [AuthController::class, 'me']);

        // Profile
        Route::put('profile',                         [ProfileController::class, 'update']);
        Route::post('profile/skills',                 [ProfileController::class, 'addSkill']);
        Route::delete('profile/skills/{userSkillId}', [ProfileController::class, 'removeSkill']);

        // Users
        Route::get('users',                    [UserController::class, 'index']);
        Route::get('users/{id}',               [UserController::class, 'show']);
        Route::get('users/{userId}/reviews',   [ReviewController::class, 'forUser']);
        Route::get('users/{userId}/progress',  [ProgressController::class, 'forUser']);

        // Connections
        Route::get('connections',             [ConnectionController::class, 'index']);
        Route::post('connections',            [ConnectionController::class, 'send']);
        Route::put('connections/{id}/accept', [ConnectionController::class, 'accept']);
        Route::put('connections/{id}/reject', [ConnectionController::class, 'reject']);

        // Messages (chat)
        Route::get('connections/{connectionId}/messages',  [MessageController::class, 'index']);
        Route::post('connections/{connectionId}/messages', [MessageController::class, 'store']);

        // ── Chat Resources (yangi!) ───────────────────────────────────────
        Route::get('connections/{connectionId}/resources',  [ResourceController::class, 'indexForConnection']);
        Route::post('connections/{connectionId}/resources', [ResourceController::class, 'storeForConnection']);

        // 1-to-1 Sessions
        Route::post('connections/{connectionId}/sessions', [SessionController::class, 'propose']);
        Route::get('sessions',               [SessionController::class, 'index']);
        Route::get('sessions/{id}',          [SessionController::class, 'show']);
        Route::put('sessions/{id}/confirm',  [SessionController::class, 'confirm']);
        Route::put('sessions/{id}/cancel',   [SessionController::class, 'cancel']);
        Route::put('sessions/{id}/done',     [SessionController::class, 'markDone']);
        Route::get('sessions/{id}/resources',  [ResourceController::class, 'indexForSession']);
        Route::post('sessions/{id}/resources', [ResourceController::class, 'storeForSession']);
        Route::post('sessions/{id}/reviews',   [ReviewController::class, 'store']);
        Route::get('sessions/{id}/reviews',    [ReviewController::class, 'forSession']);

        // Group Sessions
        Route::get('group-sessions',              [GroupSessionController::class, 'index']);
        Route::post('group-sessions',             [GroupSessionController::class, 'store']);
        Route::get('group-sessions/{id}',         [GroupSessionController::class, 'show']);
        Route::post('group-sessions/{id}/join',   [GroupSessionController::class, 'join']);
        Route::delete('group-sessions/{id}/join', [GroupSessionController::class, 'leave']);
        Route::put('group-sessions/{id}/start',   [GroupSessionController::class, 'start']);
        Route::put('group-sessions/{id}/end',     [GroupSessionController::class, 'end']);
        Route::put('group-sessions/{id}/cancel',  [GroupSessionController::class, 'cancel']);
        Route::get('group-sessions/{id}/resources',  [ResourceController::class, 'indexForGroupSession']);
        Route::post('group-sessions/{id}/resources', [ResourceController::class, 'storeForGroupSession']);

        // Resources (delete any)
        Route::delete('resources/{id}', [ResourceController::class, 'destroy']);

        // Notifications
        Route::get('notifications',              [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::put('notifications/read-all',     [NotificationController::class, 'markAllAsRead']);
        Route::put('notifications/{id}/read',    [NotificationController::class, 'markAsRead']);
        Route::delete('notifications/{id}',      [NotificationController::class, 'destroy']);

        // Progress
        Route::get('progress',              [ProgressController::class, 'summary']);
        Route::get('progress/skills',       [ProgressController::class, 'skills']);
        Route::get('progress/achievements', [ProgressController::class, 'achievements']);

        // AI Matching
        Route::get('ai/matches',          [AIMatchingController::class, 'matches']);
        Route::post('ai/matches/refresh', [AIMatchingController::class, 'refresh']);

        // Campus (Phase 1 — Living Campus)
        Route::get ('campus/pulse',            [CampusController::class, 'pulse']);
        Route::get ('campus/today',            [CampusController::class, 'today']);
        Route::post('campus/session-complete', [CampusController::class, 'sessionComplete']);

        // ── Admin ────────────────────────────────────────────────────────
        Route::prefix('admin')->middleware('admin')->group(function () {
            Route::get('stats', [AdminDashboardController::class, 'stats']);

            Route::get   ('users',              [AdminUserController::class, 'index']);
            Route::get   ('users/{id}',         [AdminUserController::class, 'show']);
            Route::put   ('users/{id}/role',    [AdminUserController::class, 'updateRole']);
            Route::put   ('users/{id}/ban',     [AdminUserController::class, 'ban']);
            Route::put   ('users/{id}/unban',   [AdminUserController::class, 'unban']);
            Route::delete('users/{id}',         [AdminUserController::class, 'destroy']);

            Route::get   ('skills',    [AdminSkillController::class, 'index']);
            Route::post  ('skills',    [AdminSkillController::class, 'store']);
            Route::delete('skills/{id}', [AdminSkillController::class, 'destroy']);

            Route::get   ('sessions',     [AdminSessionController::class, 'index']);
            Route::delete('sessions/{id}', [AdminSessionController::class, 'destroy']);

            Route::get   ('group-sessions',     [AdminGroupSessionController::class, 'index']);
            Route::delete('group-sessions/{id}', [AdminGroupSessionController::class, 'destroy']);

            Route::get   ('reviews',     [AdminReviewController::class, 'index']);
            Route::delete('reviews/{id}', [AdminReviewController::class, 'destroy']);
        });
    });
});
