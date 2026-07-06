<?php

namespace App\Services;

use App\Models\Review;
use App\Models\Session;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ReviewService
{
    public function create(User $reviewer, int $sessionId, array $data): Review
    {
        // 'connection' o'rniga 'sessionConnection' ishlatildi
        $session = Session::with('sessionConnection.sender', 'sessionConnection.receiver')->findOrFail($sessionId);

        if (! $session->involves($reviewer->id)) {
            throw new AccessDeniedHttpException('You are not part of this session.');
        }

        if (! $session->isDone()) {
            throw ValidationException::withMessages([
                'session_id' => ['You can only review a completed (done) session.'],
            ]);
        }

        $conn = $session->sessionConnection;
        $revieweeId = $conn->sender_id === $reviewer->id
            ? $conn->receiver_id
            : $conn->sender_id;

        $alreadyReviewed = Review::where('session_id', $sessionId)
            ->where('reviewer_id', $reviewer->id)
            ->exists();

        if ($alreadyReviewed) {
            throw ValidationException::withMessages([
                'session_id' => ['You have already reviewed this session.'],
            ]);
        }

        $review = Review::create([
            'session_id'  => $sessionId,
            'reviewer_id' => $reviewer->id,
            'reviewee_id' => $revieweeId,
            'rating'      => $data['rating'],
            'comment'     => $data['comment'] ?? null,
        ]);

        User::find($revieweeId)?->recalculateRating();

        return $review->load(['reviewer', 'reviewee']);
    }

    public function forUser(int $userId, int $perPage = 10): LengthAwarePaginator
    {
        return Review::where('reviewee_id', $userId)
            ->with('reviewer')
            ->latest()
            ->paginate($perPage);
    }

    public function forSession(int $sessionId): \Illuminate\Database\Eloquent\Collection
    {
        return Review::where('session_id', $sessionId)
            ->with('reviewer')
            ->get();
    }

    public function canReview(User $user, int $sessionId): bool
    {
        // 'connection' o'rniga 'sessionConnection' ishlatildi
        $session = Session::with('sessionConnection')->find($sessionId);
        if (! $session || ! $session->isDone()) return false;
        if (! $session->involves($user->id)) return false;

        return ! Review::where('session_id', $sessionId)
            ->where('reviewer_id', $user->id)
            ->exists();
    }
}
