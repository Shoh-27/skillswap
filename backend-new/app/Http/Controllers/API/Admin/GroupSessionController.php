<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupSession\GroupSessionResource;
use App\Models\GroupSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupSessionController extends Controller
{
    /**
     * GET /api/v1/admin/group-sessions
     *   ?status= upcoming|live|done|cancelled
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status'   => ['sometimes', 'in:upcoming,live,done,cancelled'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = GroupSession::query()
            ->withCount('participantRecords as participants_count')
            ->with(['host', 'skill'])
            ->orderByDesc('starts_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $paginated = $query->paginate($request->integer('per_page', 20));

        return GroupSessionResource::collection($paginated)->response();
    }

    /**
     * DELETE /api/v1/admin/group-sessions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        GroupSession::findOrFail($id)->delete();

        return response()->json(['message' => 'Group session deleted.']);
    }
}
