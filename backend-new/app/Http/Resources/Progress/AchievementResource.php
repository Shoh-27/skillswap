<?php

namespace App\Http\Resources\Progress;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AchievementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'type'        => $this->type,
            'title'       => $this->title,
            'description' => $this->description,
            'icon'        => $this->icon,
            'meta'        => $this->meta,
            'earned_at'   => $this->created_at->toISOString(),
        ];
    }
}
