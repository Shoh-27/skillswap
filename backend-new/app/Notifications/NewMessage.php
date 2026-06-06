<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewMessage extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Message $message,
        private readonly User $sender
    ) {}

    public function via(object $notifiable): array
    {
        // Faqat database — email har xabar uchun juda ko'p bo'ladi
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'          => 'new_message',
            'connection_id' => $this->message->connection_id,
            'sender_id'     => $this->sender->id,
            'sender_name'   => $this->sender->name,
            'preview'       => mb_substr($this->message->message, 0, 80),
            'message'       => "{$this->sender->name}: " . mb_substr($this->message->message, 0, 60),
        ];
    }
}
