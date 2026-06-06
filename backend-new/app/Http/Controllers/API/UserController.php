<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\User\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private readonly UserService $userService) {}

    /**
     * GET /api/v1/users
     *   ?search=       matn qidirish (ism/bio)
     *   ?skill_ids[]=  bir yoki ko'p skill
     *   ?skill_id=     bitta skill (orqaga moslik)
     *   ?type=         teach|learn
     *   ?city=         shahar
     *   ?min_rating=   minimal reyting (0-5)
     *   ?sort=         relevance|rating|sessions
     *   ?per_page=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'skill_ids'   => ['sometimes', 'array'],
            'skill_ids.*' => ['integer', 'exists:skills,id'],
            'skill_id'    => ['sometimes', 'integer', 'exists:skills,id'],
            'type'        => ['sometimes', 'in:teach,learn'],
            'city'        => ['sometimes', 'string', 'max:100'],
            'min_rating'  => ['sometimes', 'numeric', 'min:0', 'max:5'],
            'search'      => ['sometimes', 'string', 'max:100'],
            'sort'        => ['sometimes', 'in:relevance,rating,sessions'],
            'per_page'    => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $filters = array_merge(
            $request->only(['skill_ids', 'skill_id', 'type', 'city', 'min_rating', 'search', 'sort']),
            ['exclude_user_id' => $request->user()->id]
        );

        $paginated = $this->userService->discover($filters, $request->integer('per_page', 15));

        return UserResource::collection($paginated)->response();
    }

    /**
     * GET /api/v1/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->findById($id);
        return (new UserResource($user))->response();
    }
}
