<?php

namespace App\Services;

use App\Models\Connection;
use App\Models\User;
use App\Notifications\ConnectionAccepted;
use App\Notifications\NewConnectionRequest;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ConnectionService
{
    public function list(User $user, string $filter, int $perPage = 15): LengthAwarePaginator
    {
        $query = match ($filter) {
            'sent'     => Connection::where('sender_id', $user->id),
            'received' => Connection::where('receiver_id', $user->id)->where('status', 'pending'),
            'accepted' => Connection::where(fn($q) => $q
                ->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id)
            )->where('status', 'accepted'),
            default    => Connection::where(fn($q) => $q
                ->where('sender_id', $user->id)
                ->orWhere('receiver_id', $user->id)
            ),
        };

        return $query->with(['sender', 'receiver'])->latest()->paginate($perPage);
    }

    public function send(User $sender, int $receiverId): Connection
    {
        if ($sender->id === $receiverId) {
            throw ValidationException::withMessages([
                'receiver_id' => ['You cannot send a connection request to yourself.'],
            ]);
        }

        $receiver = User::findOrFail($receiverId);

        $already = Connection::where(fn($q) => $q
            ->where('sender_id', $sender->id)->where('receiver_id', $receiverId)
        )->orWhere(fn($q) => $q
            ->where('sender_id', $receiverId)->where('receiver_id', $sender->id)
        )->first();

        if ($already) {
            throw ValidationException::withMessages([
                'receiver_id' => ['A connection already exists between these users.'],
            ]);
        }

        $connection = Connection::create([
            'sender_id'   => $sender->id,
            'receiver_id' => $receiverId,
            'status'      => 'pending',
        ]);

        // Bildirishnoma yuborish
        $receiver->notify(new NewConnectionRequest($connection, $sender));

        return $connection;
    }

    public function accept(User $user, int $connectionId): Connection
    {
        $connection = Connection::findOrFail($connectionId);

        if ($connection->receiver_id !== $user->id) {
            throw new AccessDeniedHttpException('Only the receiver can accept a connection request.');
        }

        if (! $connection->isPending()) {
            throw ValidationException::withMessages([
                'connection' => ['This request has already been responded to.'],
            ]);
        }

        $connection->update(['status' => 'accepted']);

        // Sender'ga bildirishnoma
        $connection->sender->notify(new ConnectionAccepted($connection, $user));

        return $connection->fresh(['sender', 'receiver']);
    }

    public function reject(User $user, int $connectionId): Connection
    {
        $connection = Connection::findOrFail($connectionId);

        if ($connection->receiver_id !== $user->id) {
            throw new AccessDeniedHttpException('Only the receiver can reject a connection request.');
        }

        if (! $connection->isPending()) {
            throw ValidationException::withMessages([
                'connection' => ['This request has already been responded to.'],
            ]);
        }

        $connection->update(['status' => 'rejected']);

        return $connection->fresh(['sender', 'receiver']);
    }
}
