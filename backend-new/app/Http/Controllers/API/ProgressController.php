<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\Progress\AchievementResource;
use App\Http\Resources\Progress\SkillProgressResource;
use App\Services\ProgressService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
    public function __construct(private readonly ProgressService $progressService) {}

    /**
     * GET /api/v1/progress
     * Joriy foydalanuvchining to'liq statistikasi + skill progresslari + achievementlar.
     */
    public function summary(Request $request): JsonResponse
    {
        $user    = $request->user()->load(['skillProgress.skill', 'achievements']);
        $summary = $this->progressService->getSummary($user);

        return response()->json([
            'data' => [
                'total_sessions'      => $summary['total_sessions'],
                'total_hours'         => $summary['total_hours'],
                'total_minutes'       => $summary['total_minutes'],
                'completed_skills'    => $summary['completed_skills'],
                'in_progress_skills'  => $summary['in_progress_skills'],
                'achievements_count'  => $summary['achievements_count'],
                'latest_achievements' => AchievementResource::collection($summary['latest_achievements']),
                'skill_progress'      => SkillProgressResource::collection($summary['skill_progress']),
            ],
        ]);
    }

    /**
     * GET /api/v1/progress/skills
     * Faqat skill progress ro'yxati (paginated).
     */
    public function skills(Request $request): JsonResponse
    {
        $progress = $this->progressService->getForUser($request->user());
        return SkillProgressResource::collection($progress)->response();
    }

    /**
     * GET /api/v1/progress/achievements
     * Barcha achievementlar.
     */
    public function achievements(Request $request): JsonResponse
    {
        $achievements = $request->user()
            ->achievements()
            ->orderByDesc('created_at')
            ->get();

        return AchievementResource::collection($achievements)->response();
    }

    /**
     * GET /api/v1/users/{userId}/progress
     * Boshqa foydalanuvchining public progressi.
     */
    public function forUser(int $userId): JsonResponse
    {
        $user    = \App\Models\User::with(['skillProgress.skill', 'achievements'])->findOrFail($userId);
        $summary = $this->progressService->getSummary($user);

        return response()->json([
            'data' => [
                'total_sessions'   => $summary['total_sessions'],
                'total_hours'      => $summary['total_hours'],
                'completed_skills' => $summary['completed_skills'],
                'achievements'     => AchievementResource::collection($summary['latest_achievements']),
                'skill_progress'   => SkillProgressResource::collection($summary['skill_progress']),
            ],
        ]);
    }
}
