<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\Notification\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notificationService) {}

    /**
     * GET /api/v1/notifications?unread=1
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'unread'   => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $notifications = $this->notificationService->list(
            $request->user(),
            $request->boolean('unread'),
            $request->integer('per_page', 20)
        );

        return NotificationResource::collection($notifications)->response();
    }

    /**
     * GET /api/v1/notifications/unread-count
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'count' => $this->notificationService->unreadCount($request->user()),
            ],
        ]);
    }

    /**
     * PUT /api/v1/notifications/{id}/read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $this->notificationService->markAsRead($request->user(), $id);
        return response()->json(['message' => 'Notification marked as read.']);
    }

    /**
     * PUT /api/v1/notifications/read-all
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $this->notificationService->markAllAsRead($request->user());
        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /**
     * DELETE /api/v1/notifications/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->notificationService->delete($request->user(), $id);
        return response()->json(['message' => 'Notification deleted.']);
    }
}
