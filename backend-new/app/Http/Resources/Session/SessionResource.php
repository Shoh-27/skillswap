<?php

namespace App\Http\Resources\Session;

use App\Http\Resources\User\UserResource;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        // Bu foydalanuvchi review bera oladimi?
        $hasReviewed = false;
        $canReview   = false;

        if ($user && $this->isDone()) {
            $hasReviewed = Review::where('session_id', $this->id)
                ->where('reviewer_id', $user->id)
                ->exists();
            $canReview = $this->involves($user->id) && ! $hasReviewed;
        }

        return [
            'id'               => $this->id,
            'connection_id'    => $this->connection_id,
            'status'           => $this->status,
            'proposed_at'      => $this->proposed_at?->toISOString(),
            'confirmed_at'     => $this->confirmed_at?->toISOString(),
            'duration_minutes' => $this->duration_minutes,
            'title'            => $this->title,
            'notes'            => $this->notes,
            'skill_tag'        => $this->skill_tag,
            'meet_link'        => $this->when(
                in_array($this->status, ['confirmed', 'done']),
                $this->meet_link
            ),
            'proposed_by'      => new UserResource($this->whenLoaded('proposedBy')),
            'is_mine'          => $this->proposed_by === $user?->id,
            'can_review'       => $canReview,
            'has_reviewed'     => $hasReviewed,
            'created_at'       => $this->created_at->toISOString(),
        ];
    }
}
