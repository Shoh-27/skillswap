<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Review\ReviewResource;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * GET /api/v1/admin/reviews
     *   ?max_rating=  faqat past baholarni ko'rish uchun (masalan 2)
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'max_rating' => ['sometimes', 'integer', 'min:1', 'max:5'],
            'per_page'   => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Review::query()
            ->with(['reviewer', 'reviewee'])
            ->orderByDesc('created_at');

        if ($request->filled('max_rating')) {
            $query->where('rating', '<=', $request->integer('max_rating'));
        }

        $paginated = $query->paginate($request->integer('per_page', 20));

        return ReviewResource::collection($paginated)->response();
    }

    /**
     * DELETE /api/v1/admin/reviews/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $review = Review::findOrFail($id);
        $reviewee = $review->reviewee;
        $review->delete();
        $reviewee?->recalculateRating();

        return response()->json(['message' => 'Review deleted.']);
    }
}
