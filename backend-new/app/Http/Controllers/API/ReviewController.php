<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\CreateReviewRequest;
use App\Http\Resources\Review\ReviewResource;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(private readonly ReviewService $reviewService) {}

    /**
     * POST /api/v1/sessions/{sessionId}/reviews
     */
    public function store(CreateReviewRequest $request, int $sessionId): JsonResponse
    {
        $review = $this->reviewService->create(
            $request->user(),
            $sessionId,
            $request->validated()
        );

        return (new ReviewResource($review))->response()->setStatusCode(201);
    }

    /**
     * GET /api/v1/users/{userId}/reviews
     */
    public function forUser(int $userId): JsonResponse
    {
        $reviews = $this->reviewService->forUser($userId);
        return ReviewResource::collection($reviews)->response();
    }

    /**
     * GET /api/v1/sessions/{sessionId}/reviews
     */
    public function forSession(int $sessionId): JsonResponse
    {
        $reviews = $this->reviewService->forSession($sessionId);
        return ReviewResource::collection($reviews)->response();
    }
}
