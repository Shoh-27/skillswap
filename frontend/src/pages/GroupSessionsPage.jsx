import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Users, Clock, Calendar, Video,
  BookOpen, X, Search, Globe,
  Play, CheckCheck, UserPlus, LogOut, Hash,
} from 'lucide-react'
import { groupSessionsApi, skillsApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import {
  Avatar, Card, Button, Badge, Tabs,
  EmptyState, Spinner, Input, Textarea,
} from '../components/ui'

/* ── Helpers ── */
function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeUntil(iso) {
  const diff = new Date(iso) - Date.now()
  if (diff < 0) return 'Started'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `in ${Math.floor(h / 24)}d`
  if (h > 0)  return `in ${h}h ${m}m`
  return `in ${m}m`
}

const STATUS_BADGE = {
  upcoming:  { variant: 'indigo',  label: 'Upcoming' },
  live:      { variant: 'emerald', label: '🔴 Live' },
  done:      { variant: 'gray',    label: 'Done' },
  cancelled: { variant: 'rose',    label: 'Cancelled' },
}

/* ── Create Modal ── */
function CreateModal({ skills, onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', starts_at: '',
    duration_minutes: 60, max_participants: 10,
    skill_id: '', price: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await groupSessionsApi.create({
        ...form,
        skill_id: form.skill_id || undefined,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Create Group Session</h2>
              <p className="text-xs text-slate-400 mt-0.5">Host a skill exchange for multiple people</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {error && (
                <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-4 py-2.5">{error}</p>
            )}

            <Input label="Session Title" placeholder="e.g. React Hooks for Beginners" value={form.title} onChange={set('title')} required />

            <Textarea label="Description (optional)" placeholder="What will you cover? Who is it for?" value={form.description} onChange={set('description')} rows={3} />

            <Input label="Start Date & Time" type="datetime-local" value={form.starts_at} onChange={set('starts_at')} required />

            <div className="grid grid-cols-2 gap-3">
              {/* Duration */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[30, 60, 90, 120].map(d => (
                      <button key={d} type="button"
                              onClick={() => setForm(f => ({ ...f, duration_minutes: d }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  form.duration_minutes === d
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                              }`}
                      >
                        {d < 60 ? `${d}m` : `${d/60}h`}
                      </button>
                  ))}
                </div>
              </div>

              {/* Max participants */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Max participants</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[5, 10, 20, 50].map(n => (
                      <button key={n} type="button"
                              onClick={() => setForm(f => ({ ...f, max_participants: n }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                  form.max_participants === n
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                              }`}
                      >
                        {n}
                      </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Skill */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Related Skill (optional)</label>
              <select
                  value={form.skill_id}
                  onChange={set('skill_id')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="">No specific skill</option>
                {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={loading} className="flex-1">
                <Globe size={15} /> Create Session
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
  )
}

/* ── Session Card ── */
function GroupSessionCard({ session, onJoin, onLeave, onStart, onEnd, onCancel, onOpen }) {
  const [loading, setLoading] = useState(null)
  const s   = STATUS_BADGE[session.status]
  const pct = Math.round((session.participants_count / session.max_participants) * 100)

  const act = async (fn, key) => {
    setLoading(key)
    try { await fn(session.id) }
    finally { setLoading(null) }
  }

  return (
      <Card hover className="p-5 flex flex-col gap-4 animate-fade-in cursor-pointer" onClick={onOpen}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={s.variant}>{s.label}</Badge>
              {session.is_free
                  ? <Badge variant="emerald">Free</Badge>
                  : <Badge variant="amber">${(session.price / 100).toFixed(0)}</Badge>
              }
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1">{session.title}</h3>
          </div>
          {session.skill && (
              <span className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-2 py-1 rounded-lg flex-shrink-0">
            <BookOpen size={11} />{session.skill.name}
          </span>
          )}
        </div>

        {session.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{session.description}</p>
        )}

        {/* Host */}
        <div className="flex items-center gap-2">
          <Avatar name={session.host?.name || '?'} size="xs" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
          Hosted by <strong className="text-slate-700 dark:text-slate-300">{session.host?.name}</strong>
            {session.is_host && ' (you)'}
        </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Calendar size={12} className="text-indigo-400" />
          {fmtDate(session.starts_at)}
        </span>
          <span className="flex items-center gap-1">
          <Clock size={12} className="text-indigo-400" />
            {session.duration_minutes}m
        </span>
          {session.status === 'upcoming' && (
              <span className="ml-auto text-indigo-500 font-medium">{timeUntil(session.starts_at)}</span>
          )}
        </div>

        {/* Participants bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {session.participants_count} / {session.max_participants}
          </span>
            {session.is_full && <span className="text-rose-500 font-medium">Full</span>}
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${pct >= 90 ? 'bg-rose-400' : 'bg-indigo-400'}`}
                style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1" onClick={e => e.stopPropagation()}>
          {/* ✅ TUZATILDI: 'live' va 'upcoming' (registered bo'lganlar uchun) statusda meet_link ko'rsatiladi */}
          {session.meet_link && session.status === 'live' && (
              <a
                  href={session.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-all"
              >
                <Video size={14} /> Join Call
              </a>
          )}
          {session.status === 'upcoming' && !session.is_host && !session.is_joined && !session.is_full && (
              <Button size="sm" loading={loading === 'join'} onClick={() => act(onJoin, 'join')} className="flex-1">
                <UserPlus size={14} /> Join
              </Button>
          )}
          {session.status === 'upcoming' && !session.is_host && session.is_joined && (
              <Button size="sm" variant="secondary" loading={loading === 'leave'} onClick={() => act(onLeave, 'leave')} className="flex-1">
                <LogOut size={14} /> Leave
              </Button>
          )}
          {session.is_host && session.status === 'upcoming' && (
              <Button size="sm" variant="success" loading={loading === 'start'} onClick={() => act(onStart, 'start')}>
                <Play size={14} /> Start
              </Button>
          )}
          {session.is_host && session.status === 'live' && (
              <Button size="sm" variant="secondary" loading={loading === 'end'} onClick={() => act(onEnd, 'end')}>
                <CheckCheck size={14} /> End
              </Button>
          )}
          {session.is_host && ['upcoming', 'live'].includes(session.status) && (
              <Button size="sm" variant="danger" loading={loading === 'cancel'} onClick={() => act(onCancel, 'cancel')}>
                <X size={14} />
              </Button>
          )}
          {session.is_joined && !session.is_host && (
              <Badge variant="emerald" className="self-center">✓ Registered</Badge>
          )}
        </div>
      </Card>
  )
}

/* ── Detail Modal ── */
function DetailModal({ sessionId, onClose }) {
  // ✅ TUZATILDI: sessionId bo'yicha fresh ma'lumot yuklanadi
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    groupSessionsApi.show(sessionId)
        .then(r => setSession(r.data.data))
        .catch(() => onClose())
        .finally(() => setLoading(false))
  }, [sessionId])

  if (loading || !session) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-12 flex justify-center">
            <Spinner size={28} />
          </div>
        </div>
    )
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">{session.title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 flex flex-col gap-4">
            {session.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{session.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Date & Time</p>
                <p className="font-medium text-slate-900 dark:text-white">{fmtDate(session.starts_at)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Duration</p>
                <p className="font-medium text-slate-900 dark:text-white">{session.duration_minutes} minutes</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Participants</p>
                <p className="font-medium text-slate-900 dark:text-white">{session.participants_count} / {session.max_participants}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Price</p>
                <p className="font-medium text-slate-900 dark:text-white">{session.is_free ? 'Free' : `$${session.price}`}</p>
              </div>
            </div>

            {/* ✅ TUZATILDI: meet_link faqat live statusda ko'rsatiladi */}
            {session.meet_link && session.status === 'live' && (
                <a
                    href={session.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all"
                >
                  <Video size={16} /> Join Video Call
                </a>
            )}

            {/* Participants list */}
            {session.participants?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Participants</p>
                  <div className="flex flex-wrap gap-2">
                    {session.participants.map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <Avatar name={p.name} size="xs" />
                          <span className="text-xs text-slate-700 dark:text-slate-300">{p.name}</span>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  )
}

/* ── Main Page ── */
export default function GroupSessionsPage() {
  const { user }                    = useAuth()
  const [tab, setTab]               = useState(0)
  const [sessions, setSessions]     = useState([])
  const [skills, setSkills]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId]     = useState(null) // ✅ session o'rniga faqat id saqlanadi
  const [search, setSearch]         = useState('')
  const [skillFilter, setSkillFilter] = useState('')

  const tabFilters = ['upcoming', 'joined', 'mine', 'past']
  const tabLabels  = ['Discover', 'My Registrations', 'Hosting', 'Past']

  const load = useCallback(() => {
    setLoading(true)
    const params = { filter: tabFilters[tab] }
    if (search) params.search = search
    if (skillFilter) params.skill_id = skillFilter

    groupSessionsApi.list(params)
        .then(r => setSessions(r.data.data))
        .catch(() => {})
        .finally(() => setLoading(false))
  }, [tab, search, skillFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    skillsApi.list().then(r => setSkills(r.data.data)).catch(() => {})
  }, [])

  const handleJoin   = async (id) => { await groupSessionsApi.join(id);   load() }
  const handleLeave  = async (id) => { await groupSessionsApi.leave(id);  load() }
  const handleStart  = async (id) => { await groupSessionsApi.start(id);  load() }
  const handleEnd    = async (id) => { await groupSessionsApi.end(id);    load() }
  const handleCancel = async (id) => { await groupSessionsApi.cancel(id); load() }

  return (
      <div className="p-6 md:p-8 max-w-5xl animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Group Sessions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Join open sessions or host your own for multiple learners
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Host a Session
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
          <select
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-w-[160px]"
          >
            <option value="">All skills</option>
            {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs tabs={tabLabels} active={tab} onChange={setTab} />
        </div>

        {/* Sessions grid */}
        {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : sessions.length === 0 ? (
            <EmptyState
                icon={tab === 0 ? '🌐' : tab === 1 ? '📋' : tab === 2 ? '🎤' : '📚'}
                title={tab === 0 ? 'No upcoming sessions' : tab === 1 ? 'No registrations yet' : tab === 2 ? 'You haven\'t hosted any sessions' : 'No past sessions'}
                description={tab === 0 ? 'Be the first to host a group session!' : 'Discover sessions and join one.'}
                action={tab === 0 ? (
                    <Button onClick={() => setShowCreate(true)}>
                      <Plus size={14} /> Host a Session
                    </Button>
                ) : null}
            />
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sessions.map(session => (
                  <GroupSessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoin}
                      onLeave={handleLeave}
                      onStart={handleStart}
                      onEnd={handleEnd}
                      onCancel={handleCancel}
                      onOpen={() => setDetailId(session.id)} // ✅ faqat id uzatiladi
                  />
              ))}
            </div>
        )}

        {/* Modals */}
        {showCreate && (
            <CreateModal
                skills={skills}
                onClose={() => setShowCreate(false)}
                onSuccess={() => { setShowCreate(false); load() }}
            />
        )}
        {/* ✅ DetailModal endi sessionId qabul qiladi va o'zi yuklab oladi */}
        {detailId && (
            <DetailModal
                sessionId={detailId}
                onClose={() => setDetailId(null)}
            />
        )}
      </div>
  )
}