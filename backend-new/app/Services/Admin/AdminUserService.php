<?php

namespace App\Services\Admin;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class AdminUserService
{
    /**
     * Filters: search, role (user|admin), banned (0|1), sort (newest|oldest|rating|sessions)
     */
    public function list(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        $query = User::query();

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn ($q) => $q->where('name', 'like', $term)->orWhere('email', 'like', $term));
        }

        if (! empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (isset($filters['banned']) && $filters['banned'] !== '') {
            $query->where('is_banned', (bool) $filters['banned']);
        }

        match ($filters['sort'] ?? 'newest') {
            'oldest'   => $query->orderBy('created_at'),
            'rating'   => $query->orderByDesc('avg_rating'),
            'sessions' => $query->orderByDesc('total_sessions'),
            default    => $query->orderByDesc('created_at'),
        };

        return $query->paginate($perPage);
    }

    public function find(int $id): User
    {
        return User::with(['skillsCanTeach', 'skillsWantToLearn'])->findOrFail($id);
    }

    public function updateRole(User $user, string $role, User $actingAdmin): User
    {
        if ($user->id === $actingAdmin->id && $role !== 'admin') {
            throw ValidationException::withMessages([
                'role' => ['You cannot remove your own admin role.'],
            ]);
        }

        $user->update(['role' => $role]);

        return $user;
    }

    public function setBanned(User $user, bool $banned, User $actingAdmin): User
    {
        if ($user->id === $actingAdmin->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot ban your own account.'],
            ]);
        }

        $user->update([
            'is_banned' => $banned,
            'banned_at' => $banned ? now() : null,
        ]);

        if ($banned) {
            $user->tokens()->delete();
        }

        return $user;
    }

    public function delete(User $user, User $actingAdmin): void
    {
        if ($user->id === $actingAdmin->id) {
            throw ValidationException::withMessages([
                'user' => ['You cannot delete your own account.'],
            ]);
        }

        $user->delete();
    }
}
