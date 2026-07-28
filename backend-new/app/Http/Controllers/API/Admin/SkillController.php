<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SkillController extends Controller
{
    /**
     * GET /api/v1/admin/skills
     */
    public function index(): JsonResponse
    {
        $skills = Skill::query()
            ->withCount([
                'userSkills as teach_count' => fn ($q) => $q->where('type', 'teach'),
                'userSkills as learn_count' => fn ($q) => $q->where('type', 'learn'),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn ($s) => [
                'id'          => $s->id,
                'name'        => $s->name,
                'teach_count' => $s->teach_count,
                'learn_count' => $s->learn_count,
                'created_at'  => $s->created_at->toISOString(),
            ]);

        return response()->json(['data' => $skills]);
    }

    /**
     * POST /api/v1/admin/skills
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:60', 'unique:skills,name']]);

        $skill = Skill::create($data);

        return response()->json(['data' => $skill], 201);
    }

    /**
     * DELETE /api/v1/admin/skills/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $skill = Skill::findOrFail($id);

        if ($skill->userSkills()->exists()) {
            throw ValidationException::withMessages([
                'skill' => ['This skill is in use by users and cannot be deleted.'],
            ]);
        }

        $skill->delete();

        return response()->json(['message' => 'Skill deleted.']);
    }
}
