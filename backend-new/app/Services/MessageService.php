<?php

namespace App\Services;

use App\Models\Connection;
use App\Models\Message;
use App\Models\User;
use App\Notifications\NewMessage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class MessageService
{
    public function getMessages(User $user, int $connectionId, int $perPage = 20): LengthAwarePaginator
    {
        $connection = $this->resolveAcceptedConnection($user, $connectionId);

        return Message::where('connection_id', $connection->id)
            ->with('sender')
            ->latest()
            ->paginate($perPage);
    }

    public function sendMessage(User $user, int $connectionId, string $text): Message
    {
        $connection = $this->resolveAcceptedConnection($user, $connectionId);

        $message = Message::create([
            'connection_id' => $connection->id,
            'sender_id'     => $user->id,
            'message'       => $text,
        ]);

        // BUG FIX: receiver'ni to'g'ri topish
        $connection->load(['sender', 'receiver']);
        $receiver = $connection->sender_id === $user->id
            ? $connection->receiver
            : $connection->sender;

        // Faqat receiver online bo'lmasa notification yuborish
        // (sodda versiya — har doim yuboradi)
        if ($receiver) {
            $receiver->notify(new NewMessage($message, $user));
        }

        return $message->load('sender');
    }

    private function resolveAcceptedConnection(User $user, int $connectionId): Connection
    {
        // BUG FIX: with() qo'shildi — sender/receiver lazy loading muammosi
        $connection = Connection::with(['sender', 'receiver'])->findOrFail($connectionId);

        if (! $connection->involves($user->id)) {
            throw new AccessDeniedHttpException('You are not part of this connection.');
        }

        if (! $connection->isAccepted()) {
            throw new UnprocessableEntityHttpException('Messaging is only available for accepted connections.');
        }

        return $connection;
    }
}
