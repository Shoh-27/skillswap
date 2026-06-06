<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Skill extends Model
{
    protected $fillable = ['name'];

    public function userSkills(): HasMany
    {
        return $this->hasMany(UserSkill::class);
    }

    public function usersWhoTeach(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_skills')
            ->wherePivot('type', 'teach');
    }

    public function usersWhoLearn(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_skills')
            ->wherePivot('type', 'learn');
    }
}
