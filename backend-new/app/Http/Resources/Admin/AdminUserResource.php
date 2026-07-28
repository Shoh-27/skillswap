<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\Skill\SkillResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'email'                => $this->email,
            'role'                 => $this->role,
            'is_banned'            => (bool) $this->is_banned,
            'banned_at'            => $this->banned_at?->toISOString(),
            'city'                 => $this->city,
            'avg_rating'           => round($this->avg_rating, 2),
            'total_reviews'        => $this->total_reviews,
            'total_sessions'       => $this->total_sessions,
            'skills_can_teach'     => SkillResource::collection($this->whenLoaded('skillsCanTeach')),
            'skills_want_to_learn' => SkillResource::collection($this->whenLoaded('skillsWantToLearn')),
            'created_at'           => $this->created_at->toISOString(),
        ];
    }
}
