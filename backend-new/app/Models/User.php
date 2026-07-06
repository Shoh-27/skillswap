<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'bio',
        'avg_rating', 'total_reviews', 'total_sessions',
        'city', 'timezone',
        'last_active_at', 'streak_days', 'last_streak_date',
        'weekly_minutes', 'weekly_reset_date',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'password'          => 'hashed',
        'avg_rating'        => 'float',
        'total_reviews'     => 'integer',
        'total_sessions'    => 'integer',
        'streak_days'       => 'integer',
        'weekly_minutes'    => 'integer',
        'last_active_at'    => 'datetime',
        'last_streak_date'  => 'date',
        'weekly_reset_date' => 'date',
    ];

    // ── Skills ───────────────────────────────────────────────────────────

    public function userSkills(): HasMany
    {
        return $this->hasMany(UserSkill::class);
    }

    public function skillsCanTeach(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'user_skills')
            ->wherePivot('type', 'teach')
            ->withPivot('id', 'type')
            ->withTimestamps();
    }

    public function skillsWantToLearn(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'user_skills')
            ->wherePivot('type', 'learn')
            ->withPivot('id', 'type')
            ->withTimestamps();
    }

    // ── Connections ──────────────────────────────────────────────────────

    public function sentConnections(): HasMany
    {
        return $this->hasMany(Connection::class, 'sender_id');
    }

    public function receivedConnections(): HasMany
    {
        return $this->hasMany(Connection::class, 'receiver_id');
    }

    // ── Reviews ──────────────────────────────────────────────────────────

    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewee_id');
    }

    public function reviewsGiven(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    // ── Progress & Achievements ───────────────────────────────────────────

    public function skillProgress(): HasMany
    {
        return $this->hasMany(SkillProgress::class);
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(Achievement::class);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    public function recalculateRating(): void
    {
        $agg = $this->reviewsReceived()
            ->selectRaw('AVG(rating) as avg, COUNT(*) as cnt')
            ->first();

        $this->update([
            'avg_rating'    => round($agg->avg ?? 0, 2),
            'total_reviews' => $agg->cnt ?? 0,
        ]);
    }
}
