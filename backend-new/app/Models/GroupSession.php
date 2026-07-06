<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class GroupSession extends Model
{
    protected $fillable = [
        'host_id', 'title', 'description', 'starts_at',
        'duration_minutes', 'max_participants', 'skill_id',
        'meet_link', 'status', 'price',
    ];

    protected $casts = [
        'starts_at'        => 'datetime',
        'price'            => 'integer',
        'max_participants' => 'integer',
        'duration_minutes' => 'integer',
    ];

    // ── Relations ────────────────────────────────────────────────────────

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    public function participantRecords(): HasMany
    {
        return $this->hasMany(GroupSessionParticipant::class);
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_session_participants')
            ->withPivot('status')
            ->withTimestamps();
    }

    public function resources(): MorphMany
    {
        return $this->morphMany(Resource::class, 'resourceable');
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    public function isFull(): bool
    {
        return $this->participantRecords()->count() >= $this->max_participants;
    }

    public function isUpcoming(): bool { return $this->status === 'upcoming'; }
    public function isLive(): bool     { return $this->status === 'live'; }
    public function isDone(): bool     { return $this->status === 'done'; }

    public function participantCount(): int
    {
        return $this->participantRecords()->count();
    }

    /** Jitsi meet linki avtomatik generatsiya */
    public static function generateMeetLink(string $roomId): string
    {
        return "https://meet.jit.si/skillswap-group-{$roomId}";
    }
}
