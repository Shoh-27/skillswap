<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\User\UserResource;
use App\Services\AIMatchingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIMatchingController extends Controller
{
    public function __construct(private readonly AIMatchingService $aiService) {}

    /**
     * GET /api/v1/ai/matches
     * Joriy foydalanuvchi uchun AI tavsiyalari.
     */
    public function matches(Request $request): JsonResponse
    {
        $request->validate([
            'limit' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ]);

        $user   = $request->user()->load(['skillsCanTeach', 'skillsWantToLearn']);
        $result = $this->aiService->getMatches($user, $request->integer('limit', 6));

        // User resurslarini formatlash
        $matches = collect($result['matches'])->map(function ($match) {
            return [
                'user'   => new UserResource($match['user']),
                'reason' => $match['reason'],
                'score'  => $match['score'],
            ];
        });

        return response()->json([
            'data' => [
                'matches'     => $matches,
                'explanation' => $result['explanation'],
                'cached_at'   => $result['cached_at'],
            ],
        ]);
    }

    /**
     * POST /api/v1/ai/matches/refresh
     * Cache ni yangilash va yangi tavsiyalar olish.
     */
    public function refresh(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->aiService->invalidateCache($user->id);

        $user->load(['skillsCanTeach', 'skillsWantToLearn']);
        $result = $this->aiService->getMatches($user);

        $matches = collect($result['matches'])->map(fn($m) => [
            'user'   => new UserResource($m['user']),
            'reason' => $m['reason'],
            'score'  => $m['score'],
        ]);

        return response()->json([
            'data' => [
                'matches'     => $matches,
                'explanation' => $result['explanation'],
                'cached_at'   => $result['cached_at'],
            ],
        ]);
    }
}
