<?php

namespace App\Notifications;

use App\Models\Connection;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewConnectionRequest extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Connection $connection,
        private readonly User $sender
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("{$this->sender->name} wants to connect on SkillSwap!")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->sender->name} sent you a connection request.")
            ->line("They want to exchange skills with you.")
            ->action('View Request', url('/connections'))
            ->line('Log in to accept or decline.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'connection_request',
            'connection_id' => $this->connection->id,
            'sender_id'     => $this->sender->id,
            'sender_name'   => $this->sender->name,
            'message'       => "{$this->sender->name} wants to connect with you.",
        ];
    }
}
