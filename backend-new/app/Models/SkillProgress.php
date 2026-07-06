<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SkillProgress extends Model
{
    protected $table = 'skill_progress';

    protected $fillable = [
        'user_id', 'skill_id',
        'sessions_completed', 'sessions_as_learner', 'sessions_as_teacher',
        'total_minutes', 'is_completed', 'completed_at', 'milestones',
    ];

    protected $casts = [
        'is_completed'        => 'boolean',
        'completed_at'        => 'datetime',
        'milestones'          => 'array',
        'sessions_completed'  => 'integer',
        'sessions_as_learner' => 'integer',
        'sessions_as_teacher' => 'integer',
        'total_minutes'       => 'integer',
    ];

    // ── Relations ────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    /** Nechta sessiya qolganda "completed" bo'ladi */
    public const COMPLETION_THRESHOLD = 5;

    public function progressPercent(): int
    {
        return min(100, (int) round(
            ($this->sessions_completed / self::COMPLETION_THRESHOLD) * 100
        ));
    }

    public function hasMilestone(string $key): bool
    {
        return in_array($key, $this->milestones ?? []);
    }

    public function addMilestone(string $key): void
    {
        $milestones   = $this->milestones ?? [];
        $milestones[] = $key;
        $this->update(['milestones' => array_unique($milestones)]);
    }
}
