<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminSessionResource;
use App\Models\Session;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * GET /api/v1/admin/sessions
     *   ?status= proposed|confirmed|done|cancelled
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status'   => ['sometimes', 'in:proposed,confirmed,done,cancelled'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Session::query()
            ->with(['sessionConnection.sender', 'sessionConnection.receiver'])
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $paginated = $query->paginate($request->integer('per_page', 20));

        return AdminSessionResource::collection($paginated)->response();
    }

    /**
     * DELETE /api/v1/admin/sessions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        Session::findOrFail($id)->delete();

        return response()->json(['message' => 'Session deleted.']);
    }
}
