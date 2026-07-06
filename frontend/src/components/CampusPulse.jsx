import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { campusApi } from '../services/api'
import { Spinner } from './ui'

/* ── Animated pulse dot ── */
function LiveDot({ color = 'emerald' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${color}-400 opacity-60`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-${color}-500`} />
    </span>
  )
}

/* ── Single activity item ── */
function ActivityItem({ icon, message, ago, delay = 0 }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div
      className={`flex items-start gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'
      }`}
    >
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{ago}</p>
      </div>
    </div>
  )
}

/* ── Upcoming group session card ── */
function UpcomingGroupCard({ group }) {
  return (
    <Link
      to="/group-sessions"
      className="block bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 hover:shadow-md transition-all duration-200 no-underline group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <LiveDot color="indigo" />
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {group.starts_in}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{group.title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            #{group.skill} · {group.host} tomonidan
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{group.spots_left} joy</p>
          <p className="text-[10px] text-slate-400">qoldi</p>
        </div>
      </div>
    </Link>
  )
}

/* ── Streak badge ── */
function StreakBadge({ streak }) {
  if (!streak || streak < 2) return null
  const emoji = streak >= 30 ? '⭐' : streak >= 14 ? '⚡' : streak >= 7 ? '🔥' : '🌱'
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-full">
      <span className="text-sm">{emoji}</span>
      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{streak} kunlik streak</span>
    </div>
  )
}

/* ── Main CampusPulse component ── */
export default function CampusPulse() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const intervalRef = useRef(null)

  const load = () => {
    campusApi.pulse()
      .then(r => {
        setData(r.data.data)
        setLastUpdate(new Date())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // Har 30 soniyada yangilash
    intervalRef.current = setInterval(load, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [])

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 flex items-center justify-center h-48">
        <Spinner size={24} />
      </div>
    )
  }

  if (!data) return null

  const {
    active_now, completed_today, upcoming_count,
    live_sessions, live_groups,
    upcoming_groups, recent_activity,
    top_this_week, my_stats,
  } = data

  return (
    <div className="flex flex-col gap-4">

      {/* ── Top stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Hozir online */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <LiveDot color="emerald" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Live</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{active_now}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">hozir aktiv</p>
        </div>

        {/* Bugun tugatilgan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center mb-1.5">
            <span className="text-base">✅</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{completed_today}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">bugun tugadi</p>
        </div>

        {/* Keyingi 2 soatda */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-center mb-1.5">
            <span className="text-base">📅</span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{upcoming_count}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">2 soatda</p>
        </div>
      </div>

      {/* ── My streak ── */}
      {my_stats.streak_days >= 2 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl px-4 py-3">
          <StreakBadge streak={my_stats.streak_days} />
          <div className="text-right">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Bu hafta: {Math.round(my_stats.weekly_minutes / 60 * 10) / 10}h
            </p>
            <p className="text-[10px] text-slate-400">o'rgandingiz</p>
          </div>
        </div>
      )}

      {/* ── Live sessions ko'rsatgichi ── */}
      {(live_sessions.length > 0 || live_groups.length > 0) && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-3">
            <LiveDot color="emerald" />
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Hozir o'rganyaptilar
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {live_groups.map((g, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 px-2.5 py-1 rounded-full font-medium">
                👥 {g.skill} — {g.participant_count} kishi
              </span>
            ))}
            {live_sessions.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 px-2.5 py-1 rounded-full font-medium">
                ⚡ {s.skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Upcoming group sessions ── */}
      {upcoming_groups.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Tez orada boshlanadi
          </p>
          {upcoming_groups.slice(0, 2).map((g, i) => (
            <UpcomingGroupCard key={i} group={g} />
          ))}
        </div>
      )}

      {/* ── Recent activity feed ── */}
      {recent_activity.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Kampus yangiliklari
            </p>
            {lastUpdate && (
              <span className="text-[10px] text-slate-300 dark:text-slate-600">
                yangilandi {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <div>
            {recent_activity.map((item, i) => (
              <ActivityItem
                key={i}
                icon={item.icon}
                message={item.message}
                ago={item.ago}
                delay={i * 80}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Bu haftaning top o'quvchilari ── */}
      {top_this_week.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Bu hafta eng faollar 🏆
          </p>
          <div className="flex flex-col gap-2.5">
            {top_this_week.map((u, i) => {
              const medals = ['🥇', '🥈', '🥉']
              const widths = [100, 75, 55]
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base w-5 text-center">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{u.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">{u.hours}h</p>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-400 to-violet-500 rounded-full transition-all duration-700"
                        style={{ width: `${widths[i]}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
