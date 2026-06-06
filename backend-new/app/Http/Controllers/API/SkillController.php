<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\Skill\SkillResource;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;

class SkillController extends Controller
{
    /**
     * GET /api/v1/skills
     * Public endpoint — no auth required.
     */
    public function index(): JsonResponse
    {
        $skills = Skill::orderBy('name')->get();

        return SkillResource::collection($skills)->response();
    }
}
