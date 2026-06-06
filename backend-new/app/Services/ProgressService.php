<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Connection;
use App\Models\Session;
use App\Models\SkillProgress;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProgressService
{
    /**
     * Guruh sessiyasi tugaganda barcha ishtirokchilar uchun progress yozish.
     * Host — teacher, qolganlar — learner sifatida.
     */
    public function recordGroupSession(\App\Models\GroupSession $session): void
    {
        if (! $session->skill_id) {
            return; // Skill belgilanmagan bo'lsa progress yozilmaydi
        }

        $participants = $session->participants()
            ->withPivot('status')
            ->where('group_session_participants.status', 'attended')
            ->get();

        \Illuminate\Support\Facades\DB::transaction(function () use ($session, $participants) {
            foreach ($participants as $participant) {
                $role = ($participant->id === $session->host_id) ? 'teacher' : 'learner';
                $this->updateProgress($participant, $session->skill_id, $role, $session->duration_minutes);
                $participant->increment('total_sessions');
                $this->checkAchievements($participant->fresh());
            }
        });
    }

    public function recordSession(Session $session): void
    {        // 'connection' o'rniga 'sessionConnection' ishlatildi
        $session->load('sessionConnection.sender.skillsCanTeach', 'sessionConnection.receiver.skillsWantToLearn');

        $conn     = $session->sessionConnection;
        $sender   = $conn->sender;
        $receiver = $conn->receiver;

        DB::transaction(function () use ($session, $sender, $receiver) {
            $teacherSkillIds = $sender->skillsCanTeach->pluck('id')->toArray();
            $learnerSkillIds = $receiver->skillsWantToLearn->pluck('id')->toArray();

            // Sender — o'qituvchi sifatida progress
            foreach ($teacherSkillIds as $skillId) {
                $this->updateProgress($sender, $skillId, 'teacher', $session->duration_minutes);
            }

            // Receiver — o'quvchi sifatida progress
            foreach ($learnerSkillIds as $skillId) {
                $this->updateProgress($receiver, $skillId, 'learner', $session->duration_minutes);
            }

            // Agar sender ham o'rganmoqchi bo'lgan narsa bo'lsa
            $senderLearnIds   = $sender->skillsWantToLearn()->pluck('id')->toArray();
            $receiverTeachIds = $receiver->skillsCanTeach()->pluck('id')->toArray();

            foreach (array_intersect($senderLearnIds, $receiverTeachIds) as $skillId) {
                $this->updateProgress($sender, $skillId, 'learner', $session->duration_minutes);
                $this->updateProgress($receiver, $skillId, 'teacher', $session->duration_minutes);
            }

            $this->checkAchievements($sender->fresh());
            $this->checkAchievements($receiver->fresh());
        });
    }

    public function updateProgress(User $user, int $skillId, string $role, int $durationMinutes): SkillProgress
    {
        $progress = SkillProgress::firstOrCreate(
            ['user_id' => $user->id, 'skill_id' => $skillId],
            [
                'sessions_completed'  => 0,
                'sessions_as_learner' => 0,
                'sessions_as_teacher' => 0,
                'total_minutes'       => 0,
                'milestones'          => [],
            ]
        );

        $newCompleted = $progress->sessions_completed + 1;

        $updates = [
            'sessions_completed' => $newCompleted,
            'total_minutes'      => $progress->total_minutes + $durationMinutes,
        ];

        if ($role === 'learner') {
            $updates['sessions_as_learner'] = $progress->sessions_as_learner + 1;
        } else {
            $updates['sessions_as_teacher'] = $progress->sessions_as_teacher + 1;
        }

        if (! $progress->is_completed && $newCompleted >= SkillProgress::COMPLETION_THRESHOLD) {
            $updates['is_completed'] = true;
            $updates['completed_at'] = now();
        }

        $progress->update($updates);
        $progress->refresh();

        $this->checkSkillMilestones($progress);

        return $progress;
    }

    public function getForUser(User $user): Collection
    {
        return SkillProgress::where('user_id', $user->id)
            ->with('skill')
            ->orderByDesc('sessions_completed')
            ->get();
    }

    public function getSummary(User $user): array
    {
        $progressData = SkillProgress::where('user_id', $user->id)->with('skill')->get();
        $achievements = Achievement::where('user_id', $user->id)->latest()->get();

        $totalMinutes     = $progressData->sum('total_minutes');
        $completedSkills  = $progressData->where('is_completed', true)->count();
        $inProgressSkills = $progressData->where('is_completed', false)
            ->where('sessions_completed', '>', 0)->count();

        return [
            'total_sessions'      => $user->total_sessions,
            'total_hours'         => round($totalMinutes / 60, 1),
            'total_minutes'       => $totalMinutes,
            'completed_skills'    => $completedSkills,
            'in_progress_skills'  => $inProgressSkills,
            'achievements_count'  => $achievements->count(),
            'latest_achievements' => $achievements->take(3)->values(),
            'skill_progress'      => $progressData->values(),
        ];
    }

    private function checkSkillMilestones(SkillProgress $progress): void
    {
        $count      = $progress->sessions_completed;
        $milestones = $progress->milestones ?? [];

        $newMilestones = $milestones;
        if ($count >= 1  && ! in_array('first', $milestones)) $newMilestones[] = 'first';
        if ($count >= 3  && ! in_array('three', $milestones)) $newMilestones[] = 'three';
        if ($count >= 5  && ! in_array('five',  $milestones)) $newMilestones[] = 'five';
        if ($count >= 10 && ! in_array('ten',   $milestones)) $newMilestones[] = 'ten';

        if ($newMilestones !== $milestones) {
            $progress->update(['milestones' => $newMilestones]);
        }
    }

    private function checkAchievements(User $user): void
    {
        $totalSessions = $user->total_sessions;

        $checks = [
            'first_session'        => $totalSessions >= 1,
            'five_sessions'        => $totalSessions >= 5,
            'ten_sessions'         => $totalSessions >= 10,
            'twenty_five_sessions' => $totalSessions >= 25,
        ];

        $asTeacher = SkillProgress::where('user_id', $user->id)->sum('sessions_as_teacher');
        $checks['first_teach'] = $asTeacher >= 1;

        $completedSkills = SkillProgress::where('user_id', $user->id)->where('is_completed', true)->count();
        $checks['skill_completed'] = $completedSkills >= 1;

        $connCount = Connection::where(fn($q) =>
        $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id)
        )->where('status', 'accepted')->count();
        $checks['connector'] = $connCount >= 5;

        $fiveStar = \App\Models\Review::where('reviewee_id', $user->id)
            ->where('rating', 5)->exists();
        $checks['five_star_teacher'] = $fiveStar;

        foreach ($checks as $type => $earned) {
            if ($earned) $this->grantAchievement($user, $type);
        }
    }

    private function grantAchievement(User $user, string $type): void
    {
        $def = Achievement::DEFINITIONS[$type] ?? null;
        if (! $def) return;

        Achievement::firstOrCreate(
            ['user_id' => $user->id, 'type' => $type],
            ['title' => $def['title'], 'description' => $def['description'], 'icon' => $def['icon']]
        );
    }
}
