<?php

namespace App\Services;

use App\Models\Connection;
use App\Models\Session;
use App\Models\User;
use App\Notifications\SessionConfirmed;
use App\Notifications\SessionProposed;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class SessionService
{
    public function __construct(private readonly ProgressService $progressService) {}

    public function list(User $user, string $filter = 'all', int $perPage = 15): LengthAwarePaginator
    {
        $connectionIds = Connection::where(fn($q) =>
        $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id)
        )->where('status', 'accepted')->pluck('id');

        // 'connection' o'rniga 'sessionConnection' ishlatildi
        $query = Session::whereIn('connection_id', $connectionIds)
            ->with(['proposedBy', 'sessionConnection.sender', 'sessionConnection.receiver', 'resources']);

        if ($filter === 'upcoming') {
            $query->whereIn('status', ['proposed', 'confirmed'])
                ->where('proposed_at', '>=', now())
                ->orderBy('proposed_at');
        } elseif ($filter === 'past') {
            $query->where('status', 'done')->latest('proposed_at');
        } else {
            $query->orderBy('proposed_at');
        }

        return $query->paginate($perPage);
    }

    public function propose(User $proposer, int $connectionId, array $data): Session
    {
        $connection = Connection::findOrFail($connectionId);

        if (! $connection->involves($proposer->id)) {
            throw new AccessDeniedHttpException('You are not part of this connection.');
        }
        if (! $connection->isAccepted()) {
            throw ValidationException::withMessages([
                'connection_id' => ['Sessions can only be proposed for accepted connections.'],
            ]);
        }

        $proposedAt = \Carbon\Carbon::parse($data['proposed_at']);
        if ($proposedAt->isPast()) {
            throw ValidationException::withMessages([
                'proposed_at' => ['Session time must be in the future.'],
            ]);
        }

        $session = Session::create([
            'connection_id'    => $connection->id,
            'proposed_by'      => $proposer->id,
            'proposed_at'      => $proposedAt,
            'duration_minutes' => $data['duration_minutes'] ?? 60,
            'status'           => 'proposed',
            'title'            => $data['title'] ?? null,
            'notes'            => $data['notes'] ?? null,
            'meet_link'        => $data['meet_link'] ?? null,
            'skill_tag'        => $data['skill_tag'] ?? null,
        ]);

        $other = $connection->sender_id === $proposer->id
            ? $connection->receiver
            : $connection->sender;

        $other->notify(new SessionProposed($session, $proposer));

        // 'connection' o'rniga 'sessionConnection' ishlatildi
        return $session->load(['proposedBy', 'sessionConnection']);
    }

    public function confirm(User $user, int $sessionId): Session
    {
        // 'connection' o'rniga 'sessionConnection' ishlatildi
        $session = Session::with('sessionConnection')->findOrFail($sessionId);

        if (! $session->involves($user->id)) {
            throw new AccessDeniedHttpException('You are not part of this session.');
        }
        if ($session->proposed_by === $user->id) {
            throw new AccessDeniedHttpException('You cannot confirm your own proposed session.');
        }
        if (! $session->isProposed()) {
            throw ValidationException::withMessages([
                'session' => ['This session cannot be confirmed in its current state.'],
            ]);
        }

        $meetLink = $session->meet_link ?: Session::generateMeetLink();

        $session->update([
            'status'       => 'confirmed',
            'confirmed_at' => now(),
            'meet_link'    => $meetLink,
        ]);

        $session->proposedBy->notify(new SessionConfirmed($session, $user));

        return $session->fresh(['proposedBy', 'sessionConnection', 'resources']);
    }

    public function cancel(User $user, int $sessionId): Session
    {
        $session = Session::with('sessionConnection')->findOrFail($sessionId);

        if (! $session->involves($user->id)) {
            throw new AccessDeniedHttpException('You are not part of this session.');
        }
        if ($session->isDone() || $session->isCancelled()) {
            throw ValidationException::withMessages([
                'session' => ['This session cannot be cancelled.'],
            ]);
        }

        $session->update(['status' => 'cancelled']);
        return $session->fresh();
    }

    public function markDone(User $user, int $sessionId): Session
    {
        $session = Session::with('sessionConnection.sender', 'sessionConnection.receiver')->findOrFail($sessionId);

        if (! $session->involves($user->id)) {
            throw new AccessDeniedHttpException('You are not part of this session.');
        }
        if (! $session->isConfirmed()) {
            throw ValidationException::withMessages([
                'session' => ['Only confirmed sessions can be marked as done.'],
            ]);
        }

        $session->update(['status' => 'done']);

        $conn = $session->sessionConnection;
        $conn->sender->notify(new \App\Notifications\SessionDoneReviewReminder($session));
        $conn->receiver->notify(new \App\Notifications\SessionDoneReviewReminder($session));

        $conn->sender->increment('total_sessions');
        $conn->receiver->increment('total_sessions');

        $this->progressService->recordSession($session);

        return $session->fresh();
    }

    public function find(User $user, int $sessionId): Session
    {
        $session = Session::with([
            'proposedBy',
            'sessionConnection.sender',
            'sessionConnection.receiver',
            'reviews.reviewer',
            'resources.uploader',
        ])->findOrFail($sessionId);

        if (! $session->involves($user->id)) {
            throw new AccessDeniedHttpException('You are not part of this session.');
        }

        return $session;
    }
}
