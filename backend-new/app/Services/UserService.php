<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserService
{
    /**
     * Advanced discover: skill, type, city, rating, search.
     *
     * Filters:
     *   skill_ids[]     – bir yoki bir nechta skill ID
     *   type            – teach | learn
     *   city            – shahar nomi
     *   min_rating      – minimal reyting (0-5)
     *   search          – ism / bio
     *   sort            – relevance | rating | sessions
     *   exclude_user_id – o'zini ko'rsatmaslik
     */
    public function discover(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()
            ->with(['skillsCanTeach', 'skillsWantToLearn']);

        if (! empty($filters['exclude_user_id'])) {
            $query->where('id', '!=', $filters['exclude_user_id']);
        }

        // Ko'p skill filter
        if (! empty($filters['skill_ids'])) {
            $skillIds = (array) $filters['skill_ids'];
            $type     = $filters['type'] ?? null;
            $query->whereHas('userSkills', function ($q) use ($skillIds, $type) {
                $q->whereIn('skill_id', $skillIds);
                if ($type) $q->where('type', $type);
            });
        } elseif (! empty($filters['skill_id'])) {
            $type = $filters['type'] ?? null;
            $query->whereHas('userSkills', function ($q) use ($filters, $type) {
                $q->where('skill_id', $filters['skill_id']);
                if ($type) $q->where('type', $type);
            });
        }

        if (! empty($filters['city'])) {
            $query->where('city', 'like', '%' . $filters['city'] . '%');
        }

        if (isset($filters['min_rating']) && $filters['min_rating'] > 0) {
            $query->where('avg_rating', '>=', $filters['min_rating']);
        }

        if (! empty($filters['search'])) {
            $term = '%' . $filters['search'] . '%';
            $query->where(fn($q) => $q->where('name', 'like', $term)->orWhere('bio', 'like', $term));
        }

        match ($filters['sort'] ?? 'relevance') {
            'rating'   => $query->orderByDesc('avg_rating')->orderByDesc('total_reviews'),
            'sessions' => $query->orderByDesc('total_sessions'),
            default    => $query->orderByDesc('avg_rating'),
        };

        return $query->paginate($perPage);
    }

    public function findById(int $id): User
    {
        return User::with([
            'skillsCanTeach',
            'skillsWantToLearn',
            'reviewsReceived.reviewer',
        ])->findOrFail($id);
    }
}
