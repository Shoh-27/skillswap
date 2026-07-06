<?php

namespace App\Http\Resources\GroupSession;

use App\Http\Resources\Skill\SkillResource;
use App\Http\Resources\User\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        $isJoined = false;
        if ($user && $this->relationLoaded('participants')) {
            $isJoined = $this->participants
                ->contains('id', $user->id);
        }

        return [
            'id'                 => $this->id,
            'title'              => $this->title,
            'description'        => $this->description,
            'starts_at'          => $this->starts_at?->toISOString(),
            'duration_minutes'   => $this->duration_minutes,
            'max_participants'   => $this->max_participants,
            'participants_count' => $this->participants_count ?? $this->participantRecords()->count(),
            'status'             => $this->status,
            'price'              => $this->price,
            'is_free'            => $this->price === 0,
            'meet_link'          => $this->meet_link,
            'is_full'            => $this->isFull(),
            'is_host'            => $user?->id === $this->host_id,
            'is_joined'          => $isJoined,
            'host'               => new UserResource($this->whenLoaded('host')),
            'skill'              => new SkillResource($this->whenLoaded('skill')),
            'participants'       => UserResource::collection($this->whenLoaded('participants')),
            'created_at'         => $this->created_at->toISOString(),
        ];
    }
}
