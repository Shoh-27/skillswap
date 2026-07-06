<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\Message\SendMessageRequest;
use App\Http\Resources\Message\MessageResource;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function __construct(private readonly MessageService $messageService) {}

    /**
     * GET /api/v1/connections/{connectionId}/messages
     */
    public function index(Request $request, int $connectionId): JsonResponse
    {
        $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $paginated = $this->messageService->getMessages(
            $request->user(),
            $connectionId,
            $request->integer('per_page', 20)
        );

        return MessageResource::collection($paginated)->response();
    }

    /**
     * POST /api/v1/connections/{connectionId}/messages
     */
    public function store(SendMessageRequest $request, int $connectionId): JsonResponse
    {
        $message = $this->messageService->sendMessage(
            $request->user(),
            $connectionId,
            $request->string('message')->toString()
        );

        $message->load('sender');

        return (new MessageResource($message))
            ->response()
            ->setStatusCode(201);
    }
}
