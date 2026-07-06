<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class Session extends Model
{
    protected $table = 'sessions_table';

    protected $fillable = [
        'connection_id', 'proposed_by', 'proposed_at',
        'confirmed_at', 'duration_minutes', 'status',
        'title', 'notes', 'meet_link', 'skill_tag',
    ];

    protected $casts = [
        'proposed_at'  => 'datetime',
        'confirmed_at' => 'datetime',
    ];

    // ── Relations ────────────────────────────────────────────────────────

    public function sessionConnection(): BelongsTo
    {
        return $this->belongsTo(Connection::class, 'connection_id');
    }

    public function proposedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'proposed_by');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function resources(): MorphMany
    {
        return $this->morphMany(Resource::class, 'resourceable');
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    public function isProposed(): bool   { return $this->status === 'proposed'; }
    public function isConfirmed(): bool  { return $this->status === 'confirmed'; }
    public function isDone(): bool       { return $this->status === 'done'; }
    public function isCancelled(): bool  { return $this->status === 'cancelled'; }

    public function involves(int $userId): bool
    {
        // 'connection' nomi Laravel ichki attribute bilan conflict qiladi,
        // shuning uchun 'sessionConnection' deb nomlandi.
        $conn = $this->relationLoaded('sessionConnection')
            ? $this->sessionConnection
            : $this->sessionConnection()->first();

        if (! $conn instanceof Connection) {
            return false;
        }

        return $conn->involves($userId);
    }

    public function isPast(): bool
    {
        return $this->proposed_at->isPast();
    }

    /** Jitsi meet linki avtomatik generatsiya */
    public static function generateMeetLink(): string
    {
        $roomId = Str::uuid()->toString();
        return "https://meet.jit.si/skillswap-{$roomId}";
    }
}
