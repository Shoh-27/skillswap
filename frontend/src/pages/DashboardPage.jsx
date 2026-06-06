import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass, MessageSquare, ArrowRight,
  BookOpen, Star, Users, Bell, Sparkles, TrendingUp,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { connectionsApi, progressApi } from '../services/api'
import { Avatar, Card, SkillTag, Badge, Spinner } from '../components/ui'
import ProgressMiniWidget from '../components/ProgressMiniWidget'
import CampusPulse from '../components/CampusPulse'
import TodaySchedule from '../components/TodaySchedule'

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, color, to }) {
  const inner = (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] ${
      to ? 'hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer' : ''
    }`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 font-medium mt-1">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to} className="no-underline">{inner}</Link> : inner
}

/* ── Greeting banner ── */
function GreetingBanner({ user, streak, pending, connections }) {
  const hour  = new Date().getHours()
  const name  = user?.name?.split(' ')[0] || ''
  const greet = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech'

  const getMessage = () => {
    if (pending > 0)
      return `${pending} ta yangi ulanish so'rovi sizni kutmoqda 👋`
    if (streak >= 7)
      return `${streak} kunlik streak — zo'r davom ettyapsiz! 🔥`
    if (connections === 0)
      return `Birinchi ulanishingizni toping va o'rganishni boshlang!`
    return `${connections} ta ulanishingiz bor. Bugun ham o'rganing!`
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-7 text-white mb-6">
      {/* Background dekor */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-violet-500/20" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-indigo-200 text-xs font-semibold mb-1 tracking-wide">{greet} 👋</p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">{name}</h1>
            <p className="text-indigo-200 text-sm mt-2 max-w-xs leading-relaxed">{getMessage()}</p>
          </div>
          <Avatar name={user?.name} size="lg" className="ring-2 ring-white/30 flex-shrink-0" />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Link to="/discover"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 text-white text-xs font-semibold hover:bg-white/30 transition-all border border-white/20 no-underline backdrop-blur-sm">
            <Compass size={13} /> Discover
          </Link>
          <Link to="/group-sessions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border border-white/15 no-underline backdrop-blur-sm">
            <Users size={13} /> Group Sessions
          </Link>
          <Link to="/progress"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border border-white/15 no-underline backdrop-blur-sm">
            <TrendingUp size={13} /> Progress
          </Link>
          <Link to="/discover"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition-all border border-white/15 no-underline backdrop-blur-sm">
            <Sparkles size={13} /> AI Matches
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const { user } = useAuth()
  const [connections, setConnections] = useState([])
  const [pending, setPending]         = useState([])
  const [streak, setStreak]           = useState(0)
  const [loadingConns, setLoadingConns] = useState(true)

  useEffect(() => {
    Promise.all([
      connectionsApi.list('accepted'),
      connectionsApi.list('received'),
    ]).then(([a, r]) => {
      setConnections(a.data.data)
      setPending(r.data.data)
    }).catch(() => {})
      .finally(() => setLoadingConns(false))
  }, [])

  const stats = [
    { n: connections.length,                       label: 'Connections',   icon: Users,    color: 'text-indigo-600 bg-indigo-50', to: '/connections' },
    { n: user?.skills_can_teach?.length ?? 0,      label: "O'rgataman",    icon: BookOpen, color: 'text-emerald-600 bg-emerald-50', to: '/profile' },
    { n: user?.skills_want_to_learn?.length ?? 0,  label: "O'rganyapman",  icon: Star,     color: 'text-amber-600 bg-amber-50', to: '/progress' },
    { n: pending.length,                            label: 'Kutilmoqda',    icon: Bell,     color: 'text-rose-600 bg-rose-50', to: '/connections' },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto animate-fade-up">

      {/* Greeting banner */}
      <GreetingBanner
        user={user}
        streak={streak}
        pending={pending.length}
        connections={connections.length}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map(({ n, label, icon, color, to }) => (
          <StatCard key={label} icon={icon} label={label} value={n} color={color} to={to} />
        ))}
      </div>

      {/* Main grid: Campus pulse + Today schedule (left) / Skills + Progress (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 mb-6">

        {/* ── Sol ustun: Kampus hayoti ── */}
        <div className="flex flex-col gap-5">

          {/* Bugungi jadval */}
          <TodaySchedule />

          {/* Kampus pulsi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Kampus hayoti
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">30s da yangilanadi</span>
            </div>
            <CampusPulse />
          </div>
        </div>

        {/* ── O'ng ustun: Skills + Progress ── */}
        <div className="flex flex-col gap-4">

          {/* Skills */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Skilllarim</h3>
              <Link to="/profile" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium no-underline hover:underline">
                Boshqarish <ArrowRight size={11} />
              </Link>
            </div>

            {user?.skills_can_teach?.length ? (
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">O'rgataman</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills_can_teach.slice(0, 4).map(s => (
                    <SkillTag key={s.id} name={s.name} type="teach" />
                  ))}
                </div>
              </div>
            ) : null}

            {user?.skills_want_to_learn?.length ? (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">O'rganyapman</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills_want_to_learn.slice(0, 4).map(s => (
                    <SkillTag key={s.id} name={s.name} type="learn" />
                  ))}
                </div>
              </div>
            ) : null}

            {!user?.skills_can_teach?.length && !user?.skills_want_to_learn?.length && (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 mb-3">Hali skill qo'shilmagan</p>
                <Link to="/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors no-underline">
                  Skill qo'shish
                </Link>
              </div>
            )}
          </Card>

          {/* Progress mini widget */}
          <ProgressMiniWidget />

          {/* Recent connections */}
          {connections.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Connectionlar</h3>
                <Link to="/connections" className="text-xs text-indigo-600 dark:text-indigo-400 font-medium no-underline hover:underline">
                  Barchasi
                </Link>
              </div>
              <div className="flex flex-col gap-2.5">
                {connections.slice(0, 4).map(conn => {
                  const other = conn.sender?.id === user?.id ? conn.receiver : conn.sender
                  return (
                    <div key={conn.id} className="flex items-center gap-3">
                      <Avatar name={other?.name || '?'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{other?.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {other?.skills_can_teach?.slice(0,2).map(s => s.name).join(', ')}
                        </p>
                      </div>
                      <Link to="/chat" className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-all">
                        <MessageSquare size={14} />
                      </Link>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
