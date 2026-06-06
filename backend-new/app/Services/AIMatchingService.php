<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AIMatchingService
{
    private string $apiKey;
    private string $model = 'claude-opus-4-5';
    private string $apiUrl = 'https://api.anthropic.com/v1/messages';

    public function __construct()
    {
        $this->apiKey = config('services.anthropic.key', env('ANTHROPIC_API_KEY', ''));
    }

    /**
     * Foydalanuvchi uchun eng mos o'qituvchilarni topadi.
     * Cache da faqat ID + reason + score saqlanadi (Eloquent obyekt emas).
     */
    public function getMatches(User $user, int $limit = 6): array
    {
        $cacheKey = "ai_matches_{$user->id}";

        // Cache da faqat sodda array saqlaymiz — Eloquent model EMAS
        $cached = Cache::remember($cacheKey, now()->addHours(6), function () use ($user, $limit) {
            return $this->computeMatches($user, $limit);
        });

        // Cache dan chiqqandan keyin User obyektlarini DB dan qayta yuklaymiz
        // Eski cache formatida 'user_id' o'rniga boshqa kalit bo'lishi mumkin — ikkalasini qo'llab-quvvatlaymiz
        $matchIds = collect($cached['matches'])->map(function ($match) {
            return $match['user_id'] ?? ($match['user']['id'] ?? null);
        })->filter()->toArray();

        $users = User::with(['skillsCanTeach', 'skillsWantToLearn'])
            ->whereIn('id', $matchIds)
            ->get()
            ->keyBy('id');

        $matches = collect($cached['matches'])->map(function ($match) use ($users) {
            $userId = $match['user_id'] ?? ($match['user']['id'] ?? null);
            if (! $userId) return null;

            $user = $users->get($userId);
            if (! $user) return null;

            return [
                'user'   => $user,
                'reason' => $match['reason'],
                'score'  => $match['score'],
            ];
        })->filter()->values()->toArray();

        return [
            'matches'     => $matches,
            'explanation' => $cached['explanation'],
            'cached_at'   => $cached['cached_at'],
        ];
    }

    /**
     * Cache ni yangilash.
     */
    public function invalidateCache(int $userId): void
    {
        Cache::forget("ai_matches_{$userId}");
    }

    /**
     * Asosiy hisoblash — faqat sodda array qaytaradi (ID lar bilan).
     */
    private function computeMatches(User $user, int $limit): array
    {
        $wantToLearn = $user->skillsWantToLearn()->pluck('name')->toArray();

        if (empty($wantToLearn)) {
            return [
                'matches'     => [],
                'explanation' => 'Add skills you want to learn to get personalized recommendations.',
                'cached_at'   => now()->toISOString(),
            ];
        }

        $candidates = User::where('id', '!=', $user->id)
            ->whereHas('userSkills', function ($q) use ($wantToLearn) {
                $q->where('type', 'teach')
                    ->whereHas('skill', fn($sq) => $sq->whereIn('name', $wantToLearn));
            })
            ->with(['skillsCanTeach', 'skillsWantToLearn'])
            ->where('avg_rating', '>=', 0)
            ->orderByDesc('avg_rating')
            ->orderByDesc('total_sessions')
            ->limit(20)
            ->get();

        if ($candidates->isEmpty()) {
            return [
                'matches'     => [],
                'explanation' => 'No teachers found for your learning goals yet. Check back soon!',
                'cached_at'   => now()->toISOString(),
            ];
        }

        $userProfile       = $this->buildUserProfile($user, $wantToLearn);
        $candidateProfiles = $candidates->map(fn($c) => $this->buildCandidateProfile($c))->toArray();

        $aiResult = $this->askClaude($userProfile, $candidateProfiles, $limit);

        // Faqat user_id, reason, score — Eloquent obyekt EMAS
        $matches = collect($aiResult['ranked_ids'] ?? [])
            ->take($limit)
            ->map(function ($id) use ($candidates, $aiResult) {
                $candidate = $candidates->firstWhere('id', $id);
                if (! $candidate) return null;

                return [
                    'user_id' => $candidate->id,
                    'reason'  => $aiResult['reasons'][$id] ?? 'Great match for your learning goals',
                    'score'   => $aiResult['scores'][$id] ?? null,
                ];
            })
            ->filter()
            ->values()
            ->toArray();

        return [
            'matches'     => $matches,
            'explanation' => $aiResult['summary'] ?? 'Here are your personalized matches.',
            'cached_at'   => now()->toISOString(),
        ];
    }

    private function buildUserProfile(User $user, array $wantToLearn): array
    {
        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'bio'            => $user->bio ?? 'No bio provided',
            'want_to_learn'  => $wantToLearn,
            'can_teach'      => $user->skillsCanTeach()->pluck('name')->toArray(),
            'total_sessions' => $user->total_sessions,
            'city'           => $user->city,
            'timezone'       => $user->timezone,
        ];
    }

    private function buildCandidateProfile(User $u): array
    {
        return [
            'id'             => $u->id,
            'name'           => $u->name,
            'bio'            => $u->bio ?? '',
            'can_teach'      => $u->skillsCanTeach()->pluck('name')->toArray(),
            'want_to_learn'  => $u->skillsWantToLearn()->pluck('name')->toArray(),
            'avg_rating'     => $u->avg_rating,
            'total_sessions' => $u->total_sessions,
            'total_reviews'  => $u->total_reviews,
            'city'           => $u->city,
        ];
    }

    private function askClaude(array $userProfile, array $candidates, int $limit): array
    {
        if (empty($this->apiKey)) {
            Log::warning('ANTHROPIC_API_KEY not set — using fallback matching');
            return $this->fallbackMatching($userProfile, $candidates, $limit);
        }

        $prompt = $this->buildPrompt($userProfile, $candidates, $limit);

        try {
            $response = Http::withHeaders([
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(30)->post($this->apiUrl, [
                'model'      => $this->model,
                'max_tokens' => 1024,
                'messages'   => [
                    ['role' => 'user', 'content' => $prompt],
                ],
            ]);

            if (! $response->successful()) {
                Log::error('Claude API error', ['status' => $response->status(), 'body' => $response->body()]);
                return $this->fallbackMatching($userProfile, $candidates, $limit);
            }

            $content = $response->json('content.0.text', '');
            return $this->parseClaudeResponse($content);

        } catch (\Exception $e) {
            Log::error('Claude API exception', ['message' => $e->getMessage()]);
            return $this->fallbackMatching($userProfile, $candidates, $limit);
        }
    }

    private function buildPrompt(array $user, array $candidates, int $limit): string
    {
        $userJson       = json_encode($user, JSON_PRETTY_PRINT);
        $candidatesJson = json_encode($candidates, JSON_PRETTY_PRINT);

        return <<<PROMPT
You are a skill-matching AI for SkillSwap, a platform where people exchange skills.

LEARNER PROFILE:
{$userJson}

TEACHER CANDIDATES:
{$candidatesJson}

TASK:
Rank the top {$limit} teacher candidates for this learner. Consider:
1. Skill overlap — do they teach what the learner wants?
2. Mutual exchange potential — can the learner teach what they want to learn?
3. Rating and experience (higher is better)
4. Timezone/city compatibility if available
5. Bio compatibility (similar interests, communication style)

Respond ONLY with valid JSON, no other text:
{
  "ranked_ids": [id1, id2, id3],
  "reasons": {
    "id1": "Short reason why this is a great match (1 sentence)",
    "id2": "...",
    "id3": "..."
  },
  "scores": {
    "id1": 95,
    "id2": 88,
    "id3": 82
  },
  "summary": "One sentence overview of the recommendations"
}
PROMPT;
    }

    private function parseClaudeResponse(string $content): array
    {
        preg_match('/\{[\s\S]*\}/', $content, $matches);
        if (empty($matches)) {
            return ['ranked_ids' => [], 'reasons' => [], 'scores' => [], 'summary' => ''];
        }

        $data = json_decode($matches[0], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['ranked_ids' => [], 'reasons' => [], 'scores' => [], 'summary' => ''];
        }

        return $data;
    }

    private function fallbackMatching(array $user, array $candidates, int $limit): array
    {
        $wantToLearn = $user['want_to_learn'] ?? [];
        $canTeach    = $user['can_teach'] ?? [];

        $scored = collect($candidates)->map(function ($c) use ($wantToLearn, $canTeach) {
            $teachMatch    = count(array_intersect($c['can_teach'], $wantToLearn));
            $exchangeMatch = count(array_intersect($c['want_to_learn'] ?? [], $canTeach));
            $rating        = $c['avg_rating'] ?? 0;
            $sessions      = min($c['total_sessions'] ?? 0, 20) / 20;

            $score = ($teachMatch * 40) + ($exchangeMatch * 30) + ($rating * 4) + ($sessions * 10);

            $reasons = [];
            if ($teachMatch)    $reasons[] = "teaches " . implode(', ', array_intersect($c['can_teach'], $wantToLearn));
            if ($exchangeMatch) $reasons[] = "wants to learn " . implode(', ', array_intersect($c['want_to_learn'] ?? [], $canTeach));
            if ($rating >= 4)   $reasons[] = "highly rated ({$rating}★)";

            return [
                'id'     => $c['id'],
                'score'  => round($score),
                'reason' => empty($reasons) ? 'Good potential match' : ucfirst(implode(', ', $reasons)),
            ];
        })->sortByDesc('score')->take($limit);

        return [
            'ranked_ids' => $scored->pluck('id')->toArray(),
            'reasons'    => $scored->pluck('reason', 'id')->toArray(),
            'scores'     => $scored->pluck('score', 'id')->toArray(),
            'summary'    => 'Here are your best matches based on skill compatibility.',
        ];
    }
}
