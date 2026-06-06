<?php

namespace App\Notifications;

use App\Models\Connection;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ConnectionAccepted extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Connection $connection,
        private readonly User $acceptor
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("{$this->acceptor->name} accepted your connection!")
            ->greeting("Great news, {$notifiable->name}!")
            ->line("{$this->acceptor->name} accepted your connection request.")
            ->action('Start Chatting', url('/chat'))
            ->line('You can now message each other and schedule sessions.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'connection_accepted',
            'connection_id' => $this->connection->id,
            'acceptor_id'   => $this->acceptor->id,
            'acceptor_name' => $this->acceptor->name,
            'message'       => "{$this->acceptor->name} accepted your connection request!",
        ];
    }
}
