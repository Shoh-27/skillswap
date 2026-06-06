<?php

namespace App\Http\Resources\Progress;

use App\Http\Resources\Skill\SkillResource;
use App\Models\SkillProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SkillProgressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'skill'                => new SkillResource($this->whenLoaded('skill')),
            'sessions_completed'   => $this->sessions_completed,
            'sessions_as_learner'  => $this->sessions_as_learner,
            'sessions_as_teacher'  => $this->sessions_as_teacher,
            'total_minutes'        => $this->total_minutes,
            'total_hours'          => round($this->total_minutes / 60, 1),
            'is_completed'         => $this->is_completed,
            'completed_at'         => $this->completed_at?->toISOString(),
            'progress_percent'     => $this->progressPercent(),
            'sessions_to_complete' => max(0, SkillProgress::COMPLETION_THRESHOLD - $this->sessions_completed),
            'milestones'           => $this->milestones ?? [],
        ];
    }
}
