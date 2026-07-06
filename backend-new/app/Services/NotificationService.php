<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    /**
     * Foydalanuvchining barcha bildirishnomalari.
     */
    public function list(User $user, bool $unreadOnly = false, int $perPage = 20): LengthAwarePaginator
    {
        $query = $user->notifications();

        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        return $query->paginate($perPage);
    }

    /**
     * O'qilmagan bildirishnomalar soni.
     */
    public function unreadCount(User $user): int
    {
        return $user->unreadNotifications()->count();
    }

    /**
     * Bitta bildirishnomani o'qilgan deb belgilash.
     */
    public function markAsRead(User $user, string $notificationId): void
    {
        $notification = $user->notifications()->findOrFail($notificationId);
        $notification->markAsRead();
    }

    /**
     * Barcha bildirishnomalarni o'qilgan deb belgilash.
     */
    public function markAllAsRead(User $user): void
    {
        $user->unreadNotifications->markAsRead();
    }

    /**
     * Bitta bildirishnomani o'chirish.
     */
    public function delete(User $user, string $notificationId): void
    {
        $user->notifications()->findOrFail($notificationId)->delete();
    }
}
