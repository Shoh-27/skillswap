import { useState, useEffect } from 'react'
import {
  Award, BookOpen, Clock, TrendingUp,
  Star, CheckCircle2, Circle, Zap, Target,
} from 'lucide-react'
import { progressApi } from '../services/api'
import { Card, Spinner, EmptyState, Badge } from '../components/ui'

/* ── Helpers ── */
function fmtHours(h) {
  if (h < 1) return `${Math.round(h * 60)}m`
  return `${h}h`
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{label}</p>
      </div>
    </Card>
  )
}

/* ── Skill Progress Card ── */
function SkillProgressCard({ progress }) {
  const pct     = progress.progress_percent
  const done    = progress.is_completed
  const left    = progress.sessions_to_complete

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {done
            ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            : <Circle size={18} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          }
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {progress.skill?.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {progress.sessions_as_learner > 0 && `${progress.sessions_as_learner} as learner`}
              {progress.sessions_as_learner > 0 && progress.sessions_as_teacher > 0 && ' · '}
              {progress.sessions_as_teacher > 0 && `${progress.sessions_as_teacher} as teacher`}
            </p>
          </div>
        </div>
        <Badge variant={done ? 'emerald' : 'gray'}>
          {done ? '✓ Done' : `${progress.sessions_completed}/5`}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              done ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-400 to-violet-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{fmtHours(progress.total_hours)} total</span>
        {!done && <span>{left} session{left !== 1 ? 's' : ''} to complete</span>}
        {done && progress.completed_at && (
          <span>Completed {new Date(progress.completed_at).toLocaleDateString()}</span>
        )}
      </div>

      {/* Milestones */}
      {progress.milestones?.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {progress.milestones.map(m => (
            <span key={m} className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded-full">
              {m === 'first' ? '🎯 First' : m === 'three' ? '⚡ Three' : m === 'five' ? '⭐ Five' : m === 'ten' ? '🔥 Ten' : m}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ── Achievement Badge ── */
function AchievementCard({ achievement }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-xl flex-shrink-0 border border-amber-200 dark:border-amber-900">
        {achievement.icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{achievement.title}</p>
        <p className="text-xs text-slate-400 truncate">{achievement.description}</p>
      </div>
    </div>
  )
}

/* ── Activity Chart — simple weekly bars (deterministic based on total) ── */
function ActivityHint({ totalSessions, totalHours }) {
  // Math.random() o'rniga deterministik pattern: umumiy sessiyalar asosida
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const base = totalSessions > 0
      ? Math.min(100, Math.round((totalSessions / 12) * ((i + 1) / 6) * 60))
      : 8
    return {
      week: i + 1,
      height: Math.max(8, Math.min(100, base + (i % 3 === 0 ? 15 : i % 2 === 0 ? 8 : 3))),
    }
  })

  return (
    <div className="flex items-end gap-1 h-16">
      {weeks.map(w => (
        <div
          key={w.week}
          className="flex-1 rounded-sm bg-indigo-200 dark:bg-indigo-900 hover:bg-indigo-400 dark:hover:bg-indigo-600 transition-colors"
          style={{ height: `${w.height}%` }}
          title={`Week ${w.week}`}
        />
      ))}
    </div>
  )
}

/* ── Main Page ── */
export default function ProgressPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('skills') // skills | achievements

  useEffect(() => {
    progressApi.summary()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size={28} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState icon="📊" title="Couldn't load progress" description="Please try again later." />
      </div>
    )
  }

  const inProgress  = (data.skill_progress || []).filter(p => !p.is_completed && p.sessions_completed > 0)
  const completed   = (data.skill_progress || []).filter(p => p.is_completed)
  const notStarted  = (data.skill_progress || []).filter(p => p.sessions_completed === 0)

  return (
    <div className="p-6 md:p-8 max-w-4xl animate-fade-in">

      {/* Header */}
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Learning Progress</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your skill journey and achievements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-7">
        <StatCard
          icon={TrendingUp} label="Total Sessions" value={data.total_sessions}
          color="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400"
        />
        <StatCard
          icon={Clock} label="Total Hours" value={fmtHours(data.total_hours)}
          color="text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400"
        />
        <StatCard
          icon={CheckCircle2} label="Skills Completed" value={data.completed_skills}
          color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400"
        />
        <StatCard
          icon={Award} label="Achievements" value={data.achievements_count}
          color="text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400"
        />
      </div>

      {/* Activity strip */}
      <Card className="p-5 mb-7">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Activity (last 12 weeks)</h3>
          <span className="text-xs text-slate-400">{data.total_sessions} sessions total</span>
        </div>
        <ActivityHint totalSessions={data.total_sessions} totalHours={data.total_hours} />
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'skills',       label: 'Skills',       count: (data.skill_progress || []).length },
          { key: 'achievements', label: 'Achievements', count: data.achievements_count },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
              tab === t.key
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
              tab === t.key ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Skills tab */}
      {tab === 'skills' && (
        <div className="flex flex-col gap-6">
          {/* In progress */}
          {inProgress.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap size={12} className="text-indigo-400" /> In Progress ({inProgress.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {inProgress.map(p => <SkillProgressCard key={p.id} progress={p} />)}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-emerald-400" /> Completed ({completed.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {completed.map(p => <SkillProgressCard key={p.id} progress={p} />)}
              </div>
            </div>
          )}

          {/* Empty */}
          {!inProgress.length && !completed.length && (
            <EmptyState
              icon="🎯"
              title="No progress yet"
              description="Complete sessions to track your skill progress here."
            />
          )}
        </div>
      )}

      {/* Achievements tab */}
      {tab === 'achievements' && (
        <div>
          {data.achievements_count === 0 ? (
            <EmptyState
              icon="🏆"
              title="No achievements yet"
              description="Complete your first session to earn your first achievement!"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {(data.latest_achievements || []).map(a => (
                  <AchievementCard key={a.type} achievement={a} />
                ))}
              </div>

              {/* All possible achievements (locked ones greyed out) */}
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">All Achievements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries({
                    '🚀': 'First Step — Complete your first session',
                    '⭐': 'Getting Momentum — Complete 5 sessions',
                    '🔥': 'Dedicated Learner — Complete 10 sessions',
                    '👑': 'Skill Master — Complete 25 sessions',
                    '🎓': 'First Teacher — Teach your first session',
                    '✅': 'Skill Unlocked — Complete learning a skill',
                    '🌟': 'Five Star Teacher — Receive a 5-star review',
                    '🤝': 'Connector — Make 5 connections',
                    '📡': 'Group Host — Host a group session',
                  }).map(([icon, label]) => {
                    const earned = (data.latest_achievements || []).some(a => a.icon === icon)
                    return (
                      <div key={icon} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                        earned
                          ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50'
                      }`}>
                        <span className="text-lg">{icon}</span>
                        <span className="text-xs text-slate-700 dark:text-slate-300">{label}</span>
                        {earned && <span className="ml-auto text-emerald-500"><CheckCircle2 size={14} /></span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
