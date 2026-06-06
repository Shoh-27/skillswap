<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\GroupSession\CreateGroupSessionRequest;
use App\Http\Resources\GroupSession\GroupSessionResource;
use App\Services\GroupSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupSessionController extends Controller
{
    public function __construct(private readonly GroupSessionService $service) {}

    /**
     * GET /api/v1/group-sessions
     *   ?filter=upcoming|past|mine|joined
     *   ?skill_id=
     *   ?search=
     *   ?free_only=1
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'filter'    => ['sometimes', 'in:upcoming,past,mine,joined'],
            'skill_id'  => ['sometimes', 'integer', 'exists:skills,id'],
            'search'    => ['sometimes', 'string', 'max:100'],
            'free_only' => ['sometimes', 'boolean'],
            'per_page'  => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $filter = $request->string('filter', 'upcoming')->toString();

        // mine/joined filterlari list() orqali, qolganlari discover() orqali
        if (in_array($filter, ['mine', 'joined', 'past'])) {
            $sessions = $this->service->list(
                $request->user(), $filter, $request->integer('per_page', 15)
            );
        } else {
            $sessions = $this->service->discover(
                $request->only(['skill_id', 'search', 'free_only']),
                $request->integer('per_page', 15)
            );
        }

        return GroupSessionResource::collection($sessions)->response();
    }

    /**
     * GET /api/v1/group-sessions/{id}
     */
    public function show(int $id): JsonResponse
    {
        $session = $this->service->find($id);
        return (new GroupSessionResource($session))->response();
    }

    /**
     * POST /api/v1/group-sessions
     */
    public function store(CreateGroupSessionRequest $request): JsonResponse
    {
        $session = $this->service->create($request->user(), $request->validated());
        return (new GroupSessionResource($session))->response()->setStatusCode(201);
    }

    /**
     * POST /api/v1/group-sessions/{id}/join
     */
    public function join(Request $request, int $id): JsonResponse
    {
        $this->service->join($request->user(), $id);
        $session = $this->service->find($id);
        return (new GroupSessionResource($session))->response();
    }

    /**
     * DELETE /api/v1/group-sessions/{id}/join
     */
    public function leave(Request $request, int $id): JsonResponse
    {
        $this->service->leave($request->user(), $id);
        return response()->json(['message' => 'You have left the session.']);
    }

    /**
     * PUT /api/v1/group-sessions/{id}/start
     */
    public function start(Request $request, int $id): JsonResponse
    {
        $session = $this->service->start($request->user(), $id);
        return (new GroupSessionResource($session))->response();
    }

    /**
     * PUT /api/v1/group-sessions/{id}/end
     */
    public function end(Request $request, int $id): JsonResponse
    {
        $session = $this->service->end($request->user(), $id);
        return (new GroupSessionResource($session))->response();
    }

    /**
     * PUT /api/v1/group-sessions/{id}/cancel
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $session = $this->service->cancel($request->user(), $id);
        return (new GroupSessionResource($session))->response();
    }
}
