<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\AddSkillRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\Skill\SkillResource;
use App\Http\Resources\User\UserResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(private readonly ProfileService $profileService) {}

    /**
     * PUT /api/v1/profile
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->profileService->update($request->user(), $request->validated());
        $user->load(['skillsCanTeach', 'skillsWantToLearn']);

        return (new UserResource($user))->response();
    }

    /**
     * POST /api/v1/profile/skills
     */
    public function addSkill(AddSkillRequest $request): JsonResponse
    {
        $userSkill = $this->profileService->addSkill(
            $request->user(),
            $request->integer('skill_id'),
            $request->string('type')->toString()
        );

        $userSkill->load('skill');

        return response()->json([
            'message' => 'Skill added successfully.',
            'data'    => [
                'id'    => $userSkill->id,
                'skill' => new SkillResource($userSkill->skill),
                'type'  => $userSkill->type,
            ],
        ], 201);
    }

    /**
     * DELETE /api/v1/profile/skills/{userSkillId}
     */
    public function removeSkill(Request $request, int $userSkillId): JsonResponse
    {
        $this->profileService->removeSkill($request->user(), $userSkillId);

        return response()->json(['message' => 'Skill removed successfully.']);
    }
}
