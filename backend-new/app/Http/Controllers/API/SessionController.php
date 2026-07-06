<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Session\ProposeSessionRequest;
use App\Http\Resources\Session\SessionResource;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    public function __construct(private readonly SessionService $sessionService) {}

    /**
     * GET /api/v1/sessions?filter=upcoming|past|all
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'filter'   => ['sometimes', 'in:upcoming,past,all'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $sessions = $this->sessionService->list(
            $request->user(),
            $request->string('filter', 'all')->toString(),
            $request->integer('per_page', 15)
        );

        return SessionResource::collection($sessions)->response();
    }

    /**
     * GET /api/v1/sessions/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $session = $this->sessionService->find($request->user(), $id);
        return (new SessionResource($session))->response();
    }

    /**
     * POST /api/v1/connections/{connectionId}/sessions
     */
    public function propose(ProposeSessionRequest $request, int $connectionId): JsonResponse
    {
        $session = $this->sessionService->propose(
            $request->user(),
            $connectionId,
            $request->validated()
        );

        return (new SessionResource($session))->response()->setStatusCode(201);
    }

    /**
     * PUT /api/v1/sessions/{id}/confirm
     */
    public function confirm(Request $request, int $id): JsonResponse
    {
        $session = $this->sessionService->confirm($request->user(), $id);
        return (new SessionResource($session))->response();
    }

    /**
     * PUT /api/v1/sessions/{id}/cancel
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $session = $this->sessionService->cancel($request->user(), $id);
        return (new SessionResource($session))->response();
    }

    /**
     * PUT /api/v1/sessions/{id}/done
     */
    public function markDone(Request $request, int $id): JsonResponse
    {
        $session = $this->sessionService->markDone($request->user(), $id);
        return (new SessionResource($session))->response();
    }
}
