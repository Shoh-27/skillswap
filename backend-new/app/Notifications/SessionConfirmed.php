<?php

namespace App\Notifications;

use App\Models\Session;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class SessionConfirmed extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Session $session,
        private readonly User $confirmedBy
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Session confirmed! 🎉')
            ->greeting("Your session is confirmed, {$notifiable->name}!")
            ->line("{$this->confirmedBy->name} confirmed your session.")
            ->line("📅 " . $this->session->proposed_at->format('D, M j Y • g:i A'))
            ->line("⏱ {$this->session->duration_minutes} minutes")
            ->when($this->session->meet_link, fn($m) =>
                $m->action('Join Session', $this->session->meet_link)
            )
            ->line('Good luck with your skill exchange!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'       => 'session_confirmed',
            'session_id' => $this->session->id,
            'message'    => "Session confirmed for {$this->session->proposed_at->format('M j, g:i A')}.",
        ];
    }
}
