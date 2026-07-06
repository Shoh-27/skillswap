<?php

namespace App\Services;

use App\Models\GroupSession;
use App\Models\GroupSessionParticipant;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class GroupSessionService
{
    public function __construct(private readonly ProgressService $progressService) {}
    /**
     * Barcha ochiq guruh sessiyalari ro'yxati.
     * filter: upcoming | past | mine | joined
     */
    public function list(User $user, string $filter = 'upcoming', int $perPage = 15): LengthAwarePaginator
    {
        $query = GroupSession::with(['host', 'skill'])
            ->withCount('participantRecords as participants_count');

        match ($filter) {
            'upcoming' => $query->where('status', 'upcoming')
                                ->where('starts_at', '>=', now())
                                ->orderBy('starts_at'),
            'past'     => $query->whereIn('status', ['done', 'cancelled'])
                                ->latest('starts_at'),
            'mine'     => $query->where('host_id', $user->id)->latest(),
            'joined'   => $query->whereHas('participantRecords', fn($q) =>
                              $q->where('user_id', $user->id)
                          )->orderBy('starts_at'),
            default    => $query->orderBy('starts_at'),
        };

        return $query->paginate($perPage);
    }

    /**
     * Skill bo'yicha filter qo'shilgan discover
     */
    public function discover(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = GroupSession::with(['host', 'skill'])
            ->withCount('participantRecords as participants_count')
            ->where('status', 'upcoming')
            ->where('starts_at', '>=', now());

        if (! empty($filters['skill_id'])) {
            $query->where('skill_id', $filters['skill_id']);
        }

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn($q) =>
                $q->where('title', 'like', $term)
                  ->orWhere('description', 'like', $term)
            );
        }

        if (isset($filters['free_only']) && $filters['free_only']) {
            $query->where('price', 0);
        }

        return $query->orderBy('starts_at')->paginate($perPage);
    }

    /**
     * Yangi guruh sessiyasi yaratish.
     */
    public function create(User $host, array $data): GroupSession
    {
        $roomId   = Str::uuid()->toString();
        $meetLink = GroupSession::generateMeetLink($roomId);

        $session = GroupSession::create([
            'host_id'          => $host->id,
            'title'            => $data['title'],
            'description'      => $data['description'] ?? null,
            'starts_at'        => $data['starts_at'],
            'duration_minutes' => $data['duration_minutes'] ?? 60,
            'max_participants' => $data['max_participants'] ?? 10,
            'skill_id'         => $data['skill_id'] ?? null,
            'meet_link'        => $meetLink,
            'status'           => 'upcoming',
            'price'            => $data['price'] ?? 0,
        ]);

        // Host avtomatik ishtirokchi bo'ladi
        GroupSessionParticipant::create([
            'group_session_id' => $session->id,
            'user_id'          => $host->id,
            'status'           => 'registered',
        ]);

        return $session->load(['host', 'skill']);
    }

    /**
     * Sessiyani ko'rish.
     */
    public function find(int $id): GroupSession
    {
        return GroupSession::with([
            'host', 'skill',
            'participants',
            'resources.uploader',
        ])->withCount('participantRecords as participants_count')
          ->findOrFail($id);
    }

    /**
     * Sessiyaga qo'shilish.
     */
    public function join(User $user, int $sessionId): GroupSessionParticipant
    {
        $session = GroupSession::findOrFail($sessionId);

        if ($session->host_id === $user->id) {
            throw ValidationException::withMessages([
                'session' => ['You are the host of this session.'],
            ]);
        }

        if (! $session->isUpcoming()) {
            throw ValidationException::withMessages([
                'session' => ['This session is no longer available to join.'],
            ]);
        }

        if ($session->isFull()) {
            throw ValidationException::withMessages([
                'session' => ['This session is full.'],
            ]);
        }

        $already = GroupSessionParticipant::where('group_session_id', $sessionId)
            ->where('user_id', $user->id)
            ->exists();

        if ($already) {
            throw ValidationException::withMessages([
                'session' => ['You have already joined this session.'],
            ]);
        }

        return GroupSessionParticipant::create([
            'group_session_id' => $sessionId,
            'user_id'          => $user->id,
            'status'           => 'registered',
        ]);
    }

    /**
     * Sessiyadan chiqish.
     */
    public function leave(User $user, int $sessionId): void
    {
        $session = GroupSession::findOrFail($sessionId);

        if ($session->host_id === $user->id) {
            throw ValidationException::withMessages([
                'session' => ['Host cannot leave — cancel the session instead.'],
            ]);
        }

        GroupSessionParticipant::where('group_session_id', $sessionId)
            ->where('user_id', $user->id)
            ->delete();
    }

    /**
     * Sessiyani boshlash (host tomonidan).
     */
    public function start(User $host, int $sessionId): GroupSession
    {
        $session = GroupSession::findOrFail($sessionId);

        if ($session->host_id !== $host->id) {
            throw new AccessDeniedHttpException('Only the host can start the session.');
        }

        $session->update(['status' => 'live']);

        return $session->fresh(['host', 'skill']);
    }

    /**
     * Sessiyani tugatish.
     */
    public function end(User $host, int $sessionId): GroupSession
    {
        $session = GroupSession::findOrFail($sessionId);

        if ($session->host_id !== $host->id) {
            throw new AccessDeniedHttpException('Only the host can end the session.');
        }

        $session->update(['status' => 'done']);

        // Ishtirokchilarni "attended" deb belgilash
        GroupSessionParticipant::where('group_session_id', $sessionId)
            ->where('status', 'registered')
            ->update(['status' => 'attended']);

        // Progress yozish (skill_id bo'lsa)
        $this->progressService->recordGroupSession($session->fresh(['participants']));

        return $session->fresh();
    }

    /**
     * Sessiyani bekor qilish.
     */
    public function cancel(User $host, int $sessionId): GroupSession
    {
        $session = GroupSession::findOrFail($sessionId);

        if ($session->host_id !== $host->id) {
            throw new AccessDeniedHttpException('Only the host can cancel the session.');
        }

        $session->update(['status' => 'cancelled']);

        return $session->fresh();
    }
}
