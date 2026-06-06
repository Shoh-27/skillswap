<?php

namespace App\Notifications;

use App\Models\Session;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class SessionDoneReviewReminder extends Notification
{
    use Queueable;

    public function __construct(private readonly Session $session) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('How was your session? Leave a review ⭐')
            ->greeting("Hope it went well, {$notifiable->name}!")
            ->line('Your session has been marked as done.')
            ->line('Please take a moment to rate your partner — it helps others find great people.')
            ->action('Leave a Review', url("/sessions/{$this->session->id}/review"))
            ->line('Reviews only take 30 seconds.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'review_reminder',
            'session_id' => $this->session->id,
            'message'    => 'Your session is done! Leave a review for your partner.',
        ];
    }
}
