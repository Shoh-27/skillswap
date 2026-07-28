import { useEffect, useState } from 'react'
import {
  Users, BookOpen, Link2, Calendar, UsersRound, Star,
  MessageSquare, ShieldAlert, TrendingUp,
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { Card, Spinner, Avatar, Badge, EmptyState } from '../../components/ui'

/* ── Stat tile ── */
function Stat({ icon: Icon, label, value, tint }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">{value}</p>
        <p className="text-[11px] text-slate-400 font-medium mt-1 truncate">{label}</p>
      </div>
    </Card>
  )
}

/* ── Daily growth bar chart (last N days registrations) ── */
function GrowthChart({ data }) {
  const max = Math.max(1, ...data.map(d => d.count))
  return (
    <div className="flex items-end gap-1.5 h-36 px-1">
      {data.map(d => {
        const pct = Math.round((d.count / max) * 100)
        const day = new Date(d.date)
        const label = day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md whitespace-nowrap">
              {d.count} · {label}
            </div>
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 min-h-[3px] transition-all duration-300 group-hover:from-indigo-600 group-hover:to-indigo-500"
              style={{ height: `${Math.max(pct, 2)}%` }}
              title={`${label}: ${d.count} ta ro'yxatdan o'tish`}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ── Horizontal ranked bar list ── */
function BarList({ items, renderLabel, valueKey = 'total', color = 'bg-indigo-500' }) {
  const max = Math.max(1, ...items.map(i => i[valueKey]))
  if (!items.length) return <p className="text-sm text-slate-400 py-4 text-center">Ma'lumot yo'q</p>
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-28 flex-shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300 truncate">{renderLabel(item)}</div>
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((item[valueKey] / max) * 100, 4)}%` }} />
          </div>
          <div className="w-8 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">{item[valueKey]}</div>
        </div>
      ))}
    </div>
  )
}

const STATUS_COLORS = {
  proposed: 'bg-sky-400', confirmed: 'bg-indigo-500', done: 'bg-emerald-500', cancelled: 'bg-rose-400',
  pending: 'bg-sky-400', accepted: 'bg-emerald-500', rejected: 'bg-rose-400',
  upcoming: 'bg-sky-400', live: 'bg-emerald-500',
}

function StatusBreakdown({ title, byStatus }) {
  const entries = Object.entries(byStatus || {})
  const total = entries.reduce((s, [, v]) => s + v, 0)
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">{title}</h3>
      {total === 0 ? (
        <p className="text-sm text-slate-400 py-2">Ma'lumot yo'q</p>
      ) : (
        <>
          <div className="flex h-2.5 rounded-full overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
            {entries.map(([status, count]) => (
              <div key={status} className={STATUS_COLORS[status] || 'bg-slate-400'} style={{ width: `${(count / total) * 100}%` }} title={`${status}: ${count}`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {entries.map(([status, count]) => (
              <span key={status} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 capitalize">
                <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] || 'bg-slate-400'}`} />
                {status} <strong className="text-slate-700 dark:text-slate-200">{count}</strong>
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.stats()
      .then(r => setStats(r.data.data))
      .catch(() => setError('Statistikani yuklab bo\'lmadi.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-24"><Spinner size={28} /></div>
  if (error || !stats) return <EmptyState icon="⚠️" title={error || 'Xatolik yuz berdi'} />

  const t = stats.totals

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Statistika paneli</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">SkillSwap platformasining umumiy holati</p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Users}        label="Foydalanuvchilar" value={t.users}          tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50" />
        <Stat icon={ShieldAlert}  label="Bloklangan"        value={t.banned_users}   tint="bg-rose-50 text-rose-600 dark:bg-rose-950/50" />
        <Stat icon={BookOpen}     label="Ko'nikmalar"       value={t.skills}         tint="bg-violet-50 text-violet-600 dark:bg-violet-950/50" />
        <Stat icon={Link2}        label="Ulanishlar"        value={t.connections}    tint="bg-sky-50 text-sky-600 dark:bg-sky-950/50" />
        <Stat icon={Calendar}     label="Sessiyalar"        value={t.sessions}       tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50" />
        <Stat icon={UsersRound}   label="Guruh sessiyalari" value={t.group_sessions} tint="bg-amber-50 text-amber-600 dark:bg-amber-950/50" />
        <Stat icon={Star}         label="Sharhlar"          value={t.reviews}        tint="bg-amber-50 text-amber-600 dark:bg-amber-950/50" />
        <Stat icon={MessageSquare} label="Xabarlar"         value={t.messages}       tint="bg-slate-100 text-slate-600 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Growth chart */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Ro'yxatdan o'tishlar — so'nggi 14 kun</h3>
            <span className="flex items-center gap-1 text-xs font-medium text-indigo-500"><TrendingUp size={13} /> {stats.users_growth.reduce((s, d) => s + d.count, 0)} yangi</span>
          </div>
          <GrowthChart data={stats.users_growth} />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Reyting taqsimoti</h3>
          <BarList
            items={[5, 4, 3, 2, 1].map(star => ({ star, count: stats.rating_distribution[star] || 0 }))}
            renderLabel={item => `${'★'.repeat(item.star)}${'☆'.repeat(5 - item.star)}`}
            valueKey="count"
            color="bg-amber-400"
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <StatusBreakdown title="Sessiyalar holati" byStatus={stats.sessions_by_status} />
        <StatusBreakdown title="Ulanishlar holati" byStatus={stats.connections_by_status} />
        <StatusBreakdown title="Guruh sessiyalari holati" byStatus={stats.group_sessions_by_status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Eng ko'p so'raladigan ko'nikmalar</h3>
          <BarList items={stats.top_skills} renderLabel={s => s.name} valueKey="total" />
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Eng yuqori reytingli foydalanuvchilar</h3>
          {stats.top_rated_users.length === 0 ? <p className="text-sm text-slate-400 py-4 text-center">Hali sharhlar yo'q</p> : (
            <div className="flex flex-col gap-3">
              {stats.top_rated_users.map(u => (
                <div key={u.id} className="flex items-center gap-2.5">
                  <Avatar name={u.name} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{u.name}</p>
                  </div>
                  <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5"><Star size={11} className="fill-amber-400 text-amber-400" />{Number(u.avg_rating).toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white mb-4">Yangi ro'yxatdan o'tganlar</h3>
          <div className="flex flex-col gap-3">
            {stats.recent_users.map(u => (
              <div key={u.id} className="flex items-center gap-2.5">
                <Avatar name={u.name} size="xs" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{u.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                </div>
                {u.role === 'admin' && <Badge variant="violet">Admin</Badge>}
                {u.is_banned ? <Badge variant="rose">Bloklangan</Badge> : null}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
