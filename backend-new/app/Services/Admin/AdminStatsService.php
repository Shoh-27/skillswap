<?php

namespace App\Services\Admin;

use App\Models\Connection;
use App\Models\GroupSession;
use App\Models\Message;
use App\Models\Review;
use App\Models\Session;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminStatsService
{
    public function overview(): array
    {
        return [
            'totals'                   => $this->totals(),
            'users_growth'             => $this->usersGrowth(14),
            'sessions_by_status'       => $this->countBy(Session::query(), 'status'),
            'connections_by_status'    => $this->countBy(Connection::query(), 'status'),
            'group_sessions_by_status' => $this->countBy(GroupSession::query(), 'status'),
            'rating_distribution'      => $this->ratingDistribution(),
            'top_skills'               => $this->topSkills(8),
            'top_rated_users'          => $this->topRatedUsers(5),
            'recent_users'             => $this->recentUsers(6),
        ];
    }

    private function totals(): array
    {
        return [
            'users'          => User::count(),
            'admins'         => User::where('role', 'admin')->count(),
            'banned_users'   => User::where('is_banned', true)->count(),
            'skills'         => Skill::count(),
            'connections'    => Connection::count(),
            'sessions'       => Session::count(),
            'group_sessions' => GroupSession::count(),
            'reviews'        => Review::count(),
            'messages'       => Message::count(),
            'avg_rating'     => round((float) (User::where('total_reviews', '>', 0)->avg('avg_rating') ?? 0), 2),
        ];
    }

    private function usersGrowth(int $days): array
    {
        $from = Carbon::today()->subDays($days - 1);

        $rows = User::query()
            ->where('created_at', '>=', $from)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as count')
            ->groupBy('day')
            ->pluck('count', 'day');

        $result = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $from->copy()->addDays($i)->toDateString();
            $result[] = ['date' => $day, 'count' => (int) ($rows[$day] ?? 0)];
        }

        return $result;
    }

    private function countBy($query, string $column): array
    {
        return $query->select($column, DB::raw('COUNT(*) as count'))
            ->groupBy($column)
            ->pluck('count', $column)
            ->toArray();
    }

    private function ratingDistribution(): array
    {
        $rows = Review::query()
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $result = [];
        for ($star = 1; $star <= 5; $star++) {
            $result[$star] = (int) ($rows[$star] ?? 0);
        }

        return $result;
    }

    private function topSkills(int $limit): array
    {
        return Skill::query()
            ->withCount([
                'userSkills as teach_count' => fn ($q) => $q->where('type', 'teach'),
                'userSkills as learn_count' => fn ($q) => $q->where('type', 'learn'),
            ])
            ->get()
            ->map(fn ($skill) => [
                'id'          => $skill->id,
                'name'        => $skill->name,
                'teach_count' => $skill->teach_count,
                'learn_count' => $skill->learn_count,
                'total'       => $skill->teach_count + $skill->learn_count,
            ])
            ->sortByDesc('total')
            ->values()
            ->take($limit)
            ->all();
    }

    private function topRatedUsers(int $limit): array
    {
        return User::query()
            ->where('total_reviews', '>', 0)
            ->orderByDesc('avg_rating')
            ->orderByDesc('total_reviews')
            ->take($limit)
            ->get(['id', 'name', 'email', 'avg_rating', 'total_reviews'])
            ->toArray();
    }

    private function recentUsers(int $limit): array
    {
        return User::query()
            ->orderByDesc('created_at')
            ->take($limit)
            ->get(['id', 'name', 'email', 'role', 'is_banned', 'created_at'])
            ->toArray();
    }
}
