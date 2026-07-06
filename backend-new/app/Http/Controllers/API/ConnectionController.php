<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Connection\SendConnectionRequest;
use App\Http\Resources\Connection\ConnectionResource;
use App\Services\ConnectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConnectionController extends Controller
{
    public function __construct(private readonly ConnectionService $connectionService) {}

    /**
     * GET /api/v1/connections?filter=sent|received|accepted
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'filter'   => ['sometimes', 'in:sent,received,accepted'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $paginated = $this->connectionService->list(
            $request->user(),
            $request->string('filter', 'all')->toString(),
            $request->integer('per_page', 15)
        );

        return ConnectionResource::collection($paginated)->response();
    }

    /**
     * POST /api/v1/connections
     */
    public function send(SendConnectionRequest $request): JsonResponse
    {
        $connection = $this->connectionService->send(
            $request->user(),
            $request->integer('receiver_id')
        );

        $connection->load(['sender', 'receiver']);

        return (new ConnectionResource($connection))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT /api/v1/connections/{id}/accept
     */
    public function accept(Request $request, int $id): JsonResponse
    {
        $connection = $this->connectionService->accept($request->user(), $id);

        return (new ConnectionResource($connection))->response();
    }

    /**
     * PUT /api/v1/connections/{id}/reject
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $connection = $this->connectionService->reject($request->user(), $id);

        return (new ConnectionResource($connection))->response();
    }
}
