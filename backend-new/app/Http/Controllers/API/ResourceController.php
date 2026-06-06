<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Resource\UploadResourceRequest;
use App\Http\Resources\Resource\ResourceResource;
use App\Models\Connection;
use App\Models\GroupSession;
use App\Models\Session;
use App\Services\ResourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function __construct(private readonly ResourceService $service) {}

    // ── Session resources ─────────────────────────────────────────────────

    /**
     * GET /api/v1/sessions/{sessionId}/resources
     */
    public function indexForSession(Request $request, int $sessionId): JsonResponse
    {
        $session   = Session::findOrFail($sessionId);
        $resources = $this->service->listFor($session);
        return ResourceResource::collection($resources)->response();
    }

    /**
     * POST /api/v1/sessions/{sessionId}/resources
     */
    public function storeForSession(UploadResourceRequest $request, int $sessionId): JsonResponse
    {
        $session  = Session::findOrFail($sessionId);
        $resource = $this->createResource($request, $session);
        return (new ResourceResource($resource))->response()->setStatusCode(201);
    }

    // ── Group session resources ───────────────────────────────────────────

    /**
     * GET /api/v1/group-sessions/{groupSessionId}/resources
     */
    public function indexForGroupSession(Request $request, int $groupSessionId): JsonResponse
    {
        $session   = GroupSession::findOrFail($groupSessionId);
        $resources = $this->service->listFor($session);
        return ResourceResource::collection($resources)->response();
    }

    /**
     * POST /api/v1/group-sessions/{groupSessionId}/resources
     */
    public function storeForGroupSession(UploadResourceRequest $request, int $groupSessionId): JsonResponse
    {
        $session  = GroupSession::findOrFail($groupSessionId);
        $resource = $this->createResource($request, $session);
        return (new ResourceResource($resource))->response()->setStatusCode(201);
    }

    // ── Delete (any resource) ─────────────────────────────────────────────

    /**
     * DELETE /api/v1/resources/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->service->delete($request->user(), $id);
        return response()->json(['message' => 'Resource deleted.']);
    }

    public function indexForConnection(Request $request, int $connectionId): JsonResponse
    {
        $connection = Connection::findOrFail($connectionId);

        $resources = $this->service->listFor($connection);

        return ResourceResource::collection($resources)->response();
    }

    public function storeForConnection(
        UploadResourceRequest $request,
        int $connectionId
    ): JsonResponse
    {
        $connection = Connection::findOrFail($connectionId);

        $resource = $this->createResource($request, $connection);

        return (new ResourceResource($resource))
            ->response()
            ->setStatusCode(201);
    }

    // ── Helper ────────────────────────────────────────────────────────────

    private function createResource(UploadResourceRequest $request, object $resourceable): \App\Models\Resource
    {
        $type = $request->string('type')->toString();
        $user = $request->user();

        return match ($type) {
            'file' => $this->service->uploadFile($user, $resourceable, $request->validated(), $request->file('file')),
            'link' => $this->service->createLink($user, $resourceable, $request->validated()),
            'note' => $this->service->createNote($user, $resourceable, $request->validated()),
        };
    }
}
