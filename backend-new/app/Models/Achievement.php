<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Achievement extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'description', 'icon', 'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Barcha achievement turlari ────────────────────────────────────────

    public const DEFINITIONS = [
        'first_session' => [
            'title'       => 'First Step!',
            'description' => 'Completed your first session.',
            'icon'        => '🚀',
        ],
        'five_sessions' => [
            'title'       => 'Getting Momentum',
            'description' => 'Completed 5 sessions.',
            'icon'        => '⭐',
        ],
        'ten_sessions' => [
            'title'       => 'Dedicated Learner',
            'description' => 'Completed 10 sessions.',
            'icon'        => '🔥',
        ],
        'twenty_five_sessions' => [
            'title'       => 'Skill Master',
            'description' => 'Completed 25 sessions.',
            'icon'        => '👑',
        ],
        'first_teach' => [
            'title'       => 'First Teacher',
            'description' => 'Taught your first session.',
            'icon'        => '🎓',
        ],
        'skill_completed' => [
            'title'       => 'Skill Unlocked!',
            'description' => 'Completed learning a skill.',
            'icon'        => '✅',
        ],
        'five_star_teacher' => [
            'title'       => 'Five Star Teacher',
            'description' => 'Received a 5-star review.',
            'icon'        => '🌟',
        ],
        'connector' => [
            'title'       => 'Connector',
            'description' => 'Made 5 connections.',
            'icon'        => '🤝',
        ],
        'group_host' => [
            'title'       => 'Group Host',
            'description' => 'Hosted your first group session.',
            'icon'        => '📡',
        ],
    ];
}
