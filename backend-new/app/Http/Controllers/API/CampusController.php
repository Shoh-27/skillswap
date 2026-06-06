<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Session;
use App\Models\GroupSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CampusController extends Controller
{
    /**
     * GET /api/v1/campus/pulse
     * Kampus jonli holati — hozir nima bo'layapti.
     */
    public function pulse(Request $request): JsonResponse
    {
        $now  = Carbon::now();
        $user = $request->user();

        // Hozir active userlar (oxirgi 15 daqiqa)
        $activeCount = User::where('last_active_at', '>=', $now->copy()->subMinutes(15))->count();

        // Hozir live bo'layotgan sessionlar
        $liveSessions = Session::with(['proposedBy', 'connection.sender', 'connection.receiver'])
            ->where('status', 'confirmed')
            ->where('proposed_at', '<=', $now)
            ->where('proposed_at', '>=', $now->copy()->subHours(3))
            ->get()
            ->map(fn($s) => [
                'type'     => 'session',
                'skill'    => $s->skill_tag ?? 'Skill Exchange',
                'minutes'  => $s->duration_minutes,
                'ago'      => $s->proposed_at->diffForHumans(),
            ]);

        // Hozir live group sessionlar
        $liveGroups = GroupSession::with('host', 'skill')
            ->where('status', 'live')
            ->get()
            ->map(fn($g) => [
                'type'        => 'group',
                'title'       => $g->title,
                'skill'       => $g->skill?->name ?? 'Group Session',
                'host'        => $g->host?->name,
                'participant_count' => $g->participants_count ?? $g->participants()->count(),
            ]);

        // Kelayotgan sessionlar (2 soat ichida)
        $upcoming = Session::with('proposedBy')
            ->where('status', 'confirmed')
            ->whereBetween('proposed_at', [$now, $now->copy()->addHours(2)])
            ->count();

        // Kelayotgan group sessionlar (2 soat ichida)
        $upcomingGroups = GroupSession::with('skill')
            ->whereIn('status', ['upcoming'])
            ->whereBetween('scheduled_at', [$now, $now->copy()->addHours(2)])
            ->get()
            ->map(fn($g) => [
                'id'         => $g->id,
                'title'      => $g->title,
                'skill'      => $g->skill?->name,
                'host'       => $g->host?->name,
                'starts_in'  => Carbon::parse($g->scheduled_at)->diffForHumans(),
                'spots_left' => max(0, $g->max_participants - ($g->participants()->count())),
            ]);

        // Bugun tugatilgan sessionlar soni
        $completedToday = Session::where('status', 'done')
            ->whereDate('updated_at', $now->toDateString())
            ->count();

        // Oxirgi soatdagi activity (real voqealar)
        $recentActivity = $this->getRecentActivity();

        // Haftaning top o'rganuvchisi (bu hafta eng ko'p minutes)
        $topThisWeek = User::select('id', 'name', 'weekly_minutes')
            ->orderByDesc('weekly_minutes')
            ->limit(3)
            ->get()
            ->map(fn($u) => [
                'name'    => $u->name,
                'minutes' => $u->weekly_minutes,
                'hours'   => round($u->weekly_minutes / 60, 1),
            ]);

        // User o'zining streak va weekly progress i
        $myStats = [
            'streak_days'    => $user->streak_days ?? 0,
            'weekly_minutes' => $user->weekly_minutes ?? 0,
            'total_sessions' => $user->total_sessions ?? 0,
            'last_active_at' => $user->last_active_at?->diffForHumans(),
        ];

        // User ni active deb belgilash
        $user->update(['last_active_at' => $now]);

        return response()->json([
            'data' => [
                'active_now'       => $activeCount,
                'completed_today'  => $completedToday,
                'upcoming_count'   => $upcoming,
                'live_sessions'    => $liveSessions,
                'live_groups'      => $liveGroups,
                'upcoming_groups'  => $upcomingGroups,
                'recent_activity'  => $recentActivity,
                'top_this_week'    => $topThisWeek,
                'my_stats'         => $myStats,
            ],
        ]);
    }

    /**
     * GET /api/v1/campus/today
     * Foydalanuvchining bugungi jadvali.
     */
    public function today(Request $request): JsonResponse
    {
        $user = $request->user();
        $now  = Carbon::now();
        $eod  = $now->copy()->endOfDay();

        // Bugungi sessions (confirmed)
        $sessions = Session::with(['connection.sender', 'connection.receiver', 'proposedBy'])
            ->whereHas('connection', fn($q) =>
                $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id)
            )
            ->where('status', 'confirmed')
            ->whereDate('proposed_at', $now->toDateString())
            ->orderBy('proposed_at')
            ->get()
            ->map(function ($s) use ($user) {
                $other = $s->connection->sender_id === $user->id
                    ? $s->connection->receiver
                    : $s->connection->sender;
                return [
                    'id'         => $s->id,
                    'type'       => 'session',
                    'with'       => $other?->name,
                    'skill'      => $s->skill_tag ?? 'Skill Exchange',
                    'time'       => Carbon::parse($s->proposed_at)->format('H:i'),
                    'duration'   => $s->duration_minutes . ' min',
                    'meet_link'  => $s->meet_link,
                ];
            });

        // Bugungi group sessions (joined)
        $groups = GroupSession::with(['host', 'skill'])
            ->whereHas('participants', fn($q) => $q->where('user_id', $user->id))
            ->whereIn('status', ['upcoming', 'live'])
            ->whereDate('scheduled_at', $now->toDateString())
            ->orderBy('scheduled_at')
            ->get()
            ->map(fn($g) => [
                'id'       => $g->id,
                'type'     => 'group',
                'title'    => $g->title,
                'skill'    => $g->skill?->name,
                'host'     => $g->host?->name,
                'time'     => Carbon::parse($g->scheduled_at)->format('H:i'),
                'duration' => $g->duration_minutes . ' min',
                'status'   => $g->status,
            ]);

        $allToday = collect($sessions)->merge($groups)
            ->sortBy('time')
            ->values();

        return response()->json([
            'data' => [
                'today'        => $allToday,
                'count'        => $allToday->count(),
                'greeting'     => $this->getGreeting($user, $now),
            ],
        ]);
    }

    /**
     * POST /api/v1/campus/session-complete
     * Session tugaganda streak va weekly minutes yangilash.
     */
    public function sessionComplete(Request $request): JsonResponse
    {
        $request->validate(['minutes' => 'required|integer|min:1']);

        $user    = $request->user();
        $today   = Carbon::today();
        $minutes = $request->integer('minutes');

        // Streak hisoblash
        $lastDate = $user->last_streak_date ? Carbon::parse($user->last_streak_date) : null;

        if (!$lastDate) {
            $streak = 1;
        } elseif ($lastDate->isYesterday()) {
            $streak = ($user->streak_days ?? 0) + 1;
        } elseif ($lastDate->isToday()) {
            $streak = $user->streak_days ?? 1;
        } else {
            // Gap bor — streak sıfırlanadi
            $streak = 1;
        }

        // Weekly minutes reset (har dushanba)
        $weeklyReset = $user->weekly_reset_date
            ? Carbon::parse($user->weekly_reset_date)
            : null;

        $weeklyMinutes = $user->weekly_minutes ?? 0;
        if (!$weeklyReset || $today->isAfter($weeklyReset->copy()->addDays(6))) {
            $weeklyMinutes  = $minutes;
            $weeklyReset    = $today->copy()->startOfWeek();
        } else {
            $weeklyMinutes += $minutes;
        }

        $user->update([
            'streak_days'       => $streak,
            'last_streak_date'  => $today->toDateString(),
            'weekly_minutes'    => $weeklyMinutes,
            'weekly_reset_date' => $weeklyReset->toDateString(),
            'last_active_at'    => Carbon::now(),
        ]);

        return response()->json([
            'data' => [
                'streak_days'    => $streak,
                'weekly_minutes' => $weeklyMinutes,
                'milestone'      => $this->checkMilestone($streak),
            ],
        ]);
    }

    // ── Private helpers ─────────────────────────────────────────────────

    private function getRecentActivity(): array
    {
        $events = [];
        $now    = Carbon::now();

        // Oxirgi 2 soatda tugallangan sessionlar
        $done = Session::where('status', 'done')
            ->where('updated_at', '>=', $now->copy()->subHours(2))
            ->count();

        if ($done > 0) {
            $events[] = [
                'icon'    => '✅',
                'message' => "$done session" . ($done > 1 ? 'lar' : '') . " tugatildi",
                'ago'     => 'bugun',
            ];
        }

        // Oxirgi soatda yaratilgan group sessionlar
        $newGroups = GroupSession::with('skill')
            ->where('created_at', '>=', $now->copy()->subHour())
            ->whereIn('status', ['upcoming'])
            ->latest()
            ->limit(2)
            ->get();

        foreach ($newGroups as $g) {
            $events[] = [
                'icon'    => '🎓',
                'message' => "Yangi group session: " . ($g->skill?->name ?? $g->title),
                'ago'     => $g->created_at->diffForHumans(),
            ];
        }

        // Oxirgi soatda qo'shilgan connectionlar
        $newConns = DB::table('connections')
            ->where('status', 'accepted')
            ->where('updated_at', '>=', $now->copy()->subHour())
            ->count();

        if ($newConns > 0) {
            $events[] = [
                'icon'    => '🤝',
                'message' => "$newConns yangi connection o'rnatildi",
                'ago'     => 'so\'nggi soatda',
            ];
        }

        // Bugun eng faol skill
        $topSkill = DB::table('sessions_table')
            ->select('skill_tag', DB::raw('count(*) as cnt'))
            ->whereDate('proposed_at', Carbon::today())
            ->whereNotNull('skill_tag')
            ->groupBy('skill_tag')
            ->orderByDesc('cnt')
            ->first();

        if ($topSkill) {
            $events[] = [
                'icon'    => '🔥',
                'message' => "Bugungi eng faol skill: #{$topSkill->skill_tag}",
                'ago'     => 'bugun',
            ];
        }

        return array_slice($events, 0, 5);
    }

    private function getGreeting(User $user, Carbon $now): string
    {
        $hour  = $now->hour;
        $name  = explode(' ', $user->name)[0];
        $streak = $user->streak_days ?? 0;

        if ($hour < 12) {
            $time = "Xayrli tong";
        } elseif ($hour < 17) {
            $time = "Xayrli kun";
        } else {
            $time = "Xayrli kech";
        }

        if ($streak >= 7) {
            return "$time, $name! 🔥 $streak kunlik streak — ajoyib!";
        }
        if ($streak >= 3) {
            return "$time, $name! $streak kun ketma-ket — davom eting!";
        }
        return "$time, $name! Bugun nima o'rganamiz?";
    }

    private function checkMilestone(int $streak): ?string
    {
        return match ($streak) {
            3   => "3 kunlik streak! Zo'r boshlanyapti 🌱",
            7   => "1 haftalik streak! Siz jiddiy o'quvchisiz 🔥",
            14  => "2 hafta uzluksiz! Noyob! ⚡",
            30  => "30 kun! Siz endi kampusning yulduzisiz ⭐",
            default => null,
        };
    }
}
