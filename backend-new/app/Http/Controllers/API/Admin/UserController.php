<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminUserResource;
use App\Services\Admin\AdminUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private readonly AdminUserService $userService) {}

    /**
     * GET /api/v1/admin/users
     *   ?search=   ism/email
     *   ?role=     user|admin
     *   ?banned=   0|1
     *   ?sort=     newest|oldest|rating|sessions
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search'   => ['sometimes', 'string', 'max:100'],
            'role'     => ['sometimes', 'in:user,admin'],
            'banned'   => ['sometimes'],
            'sort'     => ['sometimes', 'in:newest,oldest,rating,sessions'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $filters = $request->only(['search', 'role', 'banned', 'sort']);
        $paginated = $this->userService->list($filters, $request->integer('per_page', 20));

        return AdminUserResource::collection($paginated)->response();
    }

    /**
     * GET /api/v1/admin/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        return (new AdminUserResource($this->userService->find($id)))->response();
    }

    /**
     * PUT /api/v1/admin/users/{id}/role
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['role' => ['required', 'in:user,admin']]);

        $user = $this->userService->find($id);
        $this->userService->updateRole($user, $data['role'], $request->user());

        return (new AdminUserResource($user))->response();
    }

    /**
     * PUT /api/v1/admin/users/{id}/ban
     */
    public function ban(Request $request, int $id): JsonResponse
    {
        $user = $this->userService->find($id);
        $this->userService->setBanned($user, true, $request->user());

        return (new AdminUserResource($user))->response();
    }

    /**
     * PUT /api/v1/admin/users/{id}/unban
     */
    public function unban(Request $request, int $id): JsonResponse
    {
        $user = $this->userService->find($id);
        $this->userService->setBanned($user, false, $request->user());

        return (new AdminUserResource($user))->response();
    }

    /**
     * DELETE /api/v1/admin/users/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $this->userService->find($id);
        $this->userService->delete($user, $request->user());

        return response()->json(['message' => 'User deleted.']);
    }
}
