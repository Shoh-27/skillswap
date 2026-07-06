<?php

namespace App\Http\Resources\Review;

use App\Http\Resources\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'session_id' => $this->session_id,
            'rating'     => $this->rating,
            'comment'    => $this->comment,
            'reviewer'   => new UserResource($this->whenLoaded('reviewer')),
            'reviewee'   => new UserResource($this->whenLoaded('reviewee')),
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
