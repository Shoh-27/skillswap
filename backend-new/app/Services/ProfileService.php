<?php

namespace App\Services;

use App\Models\Skill;
use App\Models\User;
use App\Models\UserSkill;
use App\Services\AIMatchingService;
use Illuminate\Validation\ValidationException;

class ProfileService
{
    public function __construct(private readonly AIMatchingService $aiService) {}

    public function update(User $user, array $data): User
    {
        $user->update(array_filter($data, fn($v) => ! is_null($v)));

        // Profile o'zgarganda AI matching cache ni yangilash
        $this->aiService->invalidateCache($user->id);

        return $user->fresh();
    }

    public function addSkill(User $user, int $skillId, string $type): UserSkill
    {
        $skill = Skill::findOrFail($skillId);

        $exists = UserSkill::where('user_id', $user->id)
            ->where('skill_id', $skill->id)
            ->where('type', $type)
            ->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'skill_id' => ["You already added '{$skill->name}' as a {$type} skill."],
            ]);
        }

        $userSkill = UserSkill::create([
            'user_id'  => $user->id,
            'skill_id' => $skill->id,
            'type'     => $type,
        ]);

        // Skill qo'shilganda cache yangilash
        $this->aiService->invalidateCache($user->id);

        return $userSkill;
    }

    public function removeSkill(User $user, int $userSkillId): void
    {
        // BUG FIX: user_skills.id bo'yicha o'chirish (pivot ID emas, UserSkill modeli ID)
        $userSkill = UserSkill::where('id', $userSkillId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $userSkill->delete();

        // Skill o'chirilganda cache yangilash
        $this->aiService->invalidateCache($user->id);
    }
}
