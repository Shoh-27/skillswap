import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, ChevronRight, CheckCircle2, Zap } from 'lucide-react'
import { progressApi } from '../services/api'
import { Card, Spinner } from './ui'

export default function ProgressMiniWidget() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    progressApi.summary()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Card className="p-5 flex items-center justify-center h-32">
      <Spinner />
    </Card>
  )

  if (!data) return null

  const inProgress = (data.skill_progress || [])
    .filter(p => !p.is_completed && p.sessions_completed > 0)
    .slice(0, 3)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp size={15} />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">My Progress</h3>
        </div>
        <Link to="/progress" className="flex items-center gap-0.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline no-underline font-medium">
          View all <ChevronRight size={13} />
        </Link>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Sessions', value: data.total_sessions, icon: '🎯' },
          { label: 'Hours',    value: `${data.total_hours}h`, icon: '⏱' },
          { label: 'Done',     value: data.completed_skills, icon: '✅' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="text-center bg-slate-50 dark:bg-slate-800 rounded-xl py-2.5">
            <p className="text-base font-semibold text-slate-900 dark:text-white">{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* In-progress skills */}
      {inProgress.length > 0 ? (
        <div className="flex flex-col gap-2">
          {inProgress.map(p => (
            <div key={p.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-700 dark:text-slate-300 font-medium">{p.skill?.name}</span>
                <span className="text-slate-400">{p.sessions_completed}/5</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-700"
                  style={{ width: `${p.progress_percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-2">
          Complete sessions to track progress!
        </p>
      )}

      {/* Latest achievement */}
      {data.latest_achievements?.[0] && (
        <div className="mt-4 flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50">
          <span className="text-lg">{data.latest_achievements[0].icon}</span>
          <div>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{data.latest_achievements[0].title}</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-500">Latest achievement</p>
          </div>
        </div>
      )}
    </Card>
  )
}
