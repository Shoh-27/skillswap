<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\AdminStatsService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(private readonly AdminStatsService $statsService) {}

    /**
     * GET /api/v1/admin/stats
     */
    public function stats(): JsonResponse
    {
        return response()->json(['data' => $this->statsService->overview()]);
    }
}
