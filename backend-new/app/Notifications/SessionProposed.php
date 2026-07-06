<?php

namespace App\Notifications;

use App\Models\Session;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class SessionProposed extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Session $session,
        private readonly User $proposer
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("{$this->proposer->name} proposed a session!")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->proposer->name} wants to schedule a session with you.")
            ->line("📅 Time: " . $this->session->proposed_at->format('D, M j Y • g:i A'))
            ->line("⏱ Duration: {$this->session->duration_minutes} minutes")
            ->when($this->session->title, fn($m) => $m->line("📌 Topic: {$this->session->title}"))
            ->action('View Session', url('/sessions'))
            ->line('Log in to confirm or decline.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'        => 'session_proposed',
            'session_id'  => $this->session->id,
            'proposer_id' => $this->proposer->id,
            'proposer_name'=> $this->proposer->name,
            'proposed_at' => $this->session->proposed_at->toISOString(),
            'message'     => "{$this->proposer->name} proposed a session on {$this->session->proposed_at->format('M j, g:i A')}.",
        ];
    }
}
