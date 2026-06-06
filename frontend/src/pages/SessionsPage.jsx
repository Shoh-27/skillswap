import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar, Clock, Check, X, CheckCheck,
  Plus, Link2, Video, ChevronRight, Hash,
} from 'lucide-react'
import { sessionsApi, connectionsApi, skillsApi, campusApi } from '../services/api'
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
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS = {
  proposed:  { variant: 'amber',   label: 'Proposed' },
  confirmed: { variant: 'indigo',  label: 'Confirmed' },
  done:      { variant: 'emerald', label: 'Done' },
  cancelled: { variant: 'rose',    label: 'Cancelled' },
}

/* ── Propose Modal ── */
function ProposeModal({ connection, onClose, onSuccess }) {
  const [form, setForm] = useState({
    proposed_at: '', duration_minutes: 60, title: '', notes: '', meet_link: '', skill_tag: '',
  })
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [skills, setSkills]         = useState([])
  const [skillsLoading, setSkillsLoading] = useState(true)

  useEffect(() => {
    skillsApi.list()
        .then(r => setSkills(r.data.data || []))
        .catch(() => setSkills([]))
        .finally(() => setSkillsLoading(false))
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.proposed_at) { setError('Please select a date and time.'); return }
    setError('')
    setLoading(true)
    try {
      await sessionsApi.propose(connection.id, form)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  const { user: authUser } = useAuth()
  const otherUser = connection?.sender?.id === authUser?.id
      ? connection?.receiver
      : connection?.sender

  return (
      <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-fade-in">

          {/* Header — sticky */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Propose a Session</h2>
              {otherUser && (
                  <p className="text-xs text-slate-400 mt-0.5">with {otherUser.name}</p>
              )}
            </div>
            <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">

            {error && (
                <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-4 py-2.5">
                  {error}
                </p>
            )}

            {/* Date & Time */}
            <Input
                label="Session Date & Time"
                type="datetime-local"
                value={form.proposed_at}
                onChange={set('proposed_at')}
                required
            />

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map(d => (
                    <button
                        key={d}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, duration_minutes: d }))}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                            form.duration_minutes === d
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200/50'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                    >
                      {d < 60 ? `${d}m` : `${d / 60}h`}
                    </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <Input
                label="Topic (optional)"
                placeholder="e.g. React Hooks deep dive"
                value={form.title}
                onChange={set('title')}
            />

            {/* Meeting Link */}
            <Input
                label="Meeting Link (optional)"
                placeholder="https://meet.google.com/..."
                value={form.meet_link}
                onChange={set('meet_link')}
            />

            {/* Skill Tag */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hash size={13} className="text-indigo-500" />
                Skill Tag <span className="text-slate-400 font-normal">(optional)</span>
              </label>

              {skillsLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Spinner size={14} />
                    <span className="text-xs text-slate-400">Loading skills…</span>
                  </div>
              ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, skill_tag: '' }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                            form.skill_tag === ''
                                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-400'
                        }`}
                    >
                      None
                    </button>
                    {skills.map(s => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, skill_tag: s.name }))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                                form.skill_tag === s.name
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200/50'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                            }`}
                        >
                          #{s.name}
                        </button>
                    ))}
                  </div>
              )}
            </div>

            {/* Notes */}
            <Textarea
                label="Notes (optional)"
                placeholder="What will you cover? Any prep needed?"
                value={form.notes}
                onChange={set('notes')}
                rows={3}
            />
          </div>

          {/* Footer — sticky */}
          <div className="flex gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900 rounded-b-2xl">
            <Button
                type="button"
                loading={loading}
                disabled={loading}
                onClick={handleSubmit}
                className="flex-1"
            >
              <Calendar size={15} /> Send Proposal
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
  )
}

/* ── Session Card ── */
function SessionCard({ session, currentUserId, onConfirm, onCancel, onMarkDone, onReview }) {
  const [loading, setLoading] = useState(null)
  const s = STATUS[session.status]
  const isProposer = session.proposed_by?.id === currentUserId
  const canConfirm  = session.status === 'proposed' && !isProposer
  const canCancel   = ['proposed', 'confirmed'].includes(session.status)
  const canMarkDone = session.status === 'confirmed'
  const canReview   = session.status === 'done'

  const act = async (fn, key) => {
    setLoading(key)
    try { await fn(session.id) }
    finally { setLoading(null) }
  }

  return (
      <Card className="p-5 flex flex-col gap-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {session.title || 'Skill Exchange Session'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Proposed by {isProposer ? 'you' : session.proposed_by?.name}
            </p>
            {session.skill_tag && (
                <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-2 py-0.5 rounded-full font-medium">
              <Hash size={10} />#{session.skill_tag}
            </span>
            )}
          </div>
          <Badge variant={s.variant}>{s.label}</Badge>
        </div>

        {/* Time info */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar size={15} className="text-indigo-500 flex-shrink-0" />
            <span>{fmtDate(session.proposed_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Clock size={15} className="text-indigo-500 flex-shrink-0" />
            <span>{session.duration_minutes} minutes</span>
          </div>
          {session.meet_link && (
              <a
                  href={session.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Video size={15} className="flex-shrink-0" />
                Join Meeting
              </a>
          )}
        </div>

        {session.notes && (
            <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700">
              {session.notes}
            </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {canConfirm && (
              <Button
                  size="sm" variant="success"
                  loading={loading === 'confirm'}
                  onClick={() => act(onConfirm, 'confirm')}
              >
                <Check size={14} /> Confirm
              </Button>
          )}
          {canMarkDone && (
              <Button
                  size="sm" variant="secondary"
                  loading={loading === 'done'}
                  onClick={() => act(onMarkDone, 'done')}
              >
                <CheckCheck size={14} /> Mark as Done
              </Button>
          )}
          {canReview && (
              <Button size="sm" onClick={() => onReview(session)}>
                ⭐ Leave Review
              </Button>
          )}
          {canCancel && (
              <Button
                  size="sm" variant="danger"
                  loading={loading === 'cancel'}
                  onClick={() => act(onCancel, 'cancel')}
              >
                <X size={14} /> Cancel
              </Button>
          )}
        </div>
      </Card>
  )
}

/* ── Review Modal ── */
function ReviewModal({ session, onClose, onSuccess }) {
  const [rating, setRating]   = useState(0)
  const [hover, setHover]     = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) { setError('Please select a rating.'); return }
    setLoading(true)
    try {
      const { reviewsApi } = await import('../services/api')
      await reviewsApi.create(session.id, { rating, comment })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.')
    } finally { setLoading(false) }
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Leave a Review</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {error && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-4 py-2.5">{error}</p>}

            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Your rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => setRating(star)}
                        className="text-3xl transition-transform hover:scale-110"
                    >
                  <span className={(hover || rating) >= star ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}>
                    ★
                  </span>
                    </button>
                ))}
              </div>
              {rating > 0 && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
                  </p>
              )}
            </div>

            <Textarea
                label="Comment (optional)"
                placeholder="How was the session? What did you learn?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
            />

            <div className="flex gap-2">
              <Button type="submit" loading={loading} className="flex-1">Submit Review</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
  )
}

/* ── Main Page ── */
export default function SessionsPage() {
  const { user }                = useAuth()
  const [tab, setTab]           = useState(0)
  const [sessions, setSessions] = useState([])
  const [connections, setConns] = useState([])
  const [loading, setLoading]   = useState(true)
  const [proposeConn, setProposeConn] = useState(null)
  const [reviewSession, setReviewSession] = useState(null)

  const filters = ['upcoming', 'past', 'all']

  const load = useCallback(() => {
    setLoading(true)
    sessionsApi.list({ filter: filters[tab] })
        .then(r => setSessions(r.data.data))
        .catch(() => {})
        .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    connectionsApi.list('accepted')
        .then(r => setConns(r.data.data))
        .catch(() => {})
  }, [])

  const handleConfirm  = async (id) => { await sessionsApi.confirm(id);  load() }
  const handleCancel   = async (id) => { await sessionsApi.cancel(id);   load() }
  const handleMarkDone = async (id) => {
    const session = sessions.find(s => s.id === id)
    await sessionsApi.markDone(id)
    if (session?.duration_minutes) {
      campusApi.sessionComplete(session.duration_minutes).catch(() => {})
    }
    load()
  }

  return (
      <div className="p-6 md:p-8 max-w-4xl animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Sessions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Schedule and manage your skill exchange sessions
            </p>
          </div>
          {connections.length > 0 && (
              <Button onClick={() => setProposeConn(connections[0])}>
                <Plus size={15} /> New Session
              </Button>
          )}
        </div>

        {/* Connections quick-select */}
        {connections.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Propose with</p>
              <div className="flex gap-2 flex-wrap">
                {connections.map(conn => {
                  const other = conn.sender?.id === user?.id ? conn.receiver : conn.sender
                  return (
                      <button
                          key={conn.id}
                          onClick={() => setProposeConn(conn)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
                      >
                        <Avatar name={other?.name || '?'} size="xs" />
                        {other?.name}
                        <ChevronRight size={13} className="text-slate-400" />
                      </button>
                  )
                })}
              </div>
            </div>
        )}

        {/* Tabs */}
        <div className="max-w-xs mb-6">
          <Tabs tabs={['Upcoming', 'Past', 'All']} active={tab} onChange={setTab} />
        </div>

        {/* Sessions list */}
        {loading ? (
            <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : sessions.length === 0 ? (
            <EmptyState
                icon={tab === 1 ? '📚' : '📅'}
                title={tab === 1 ? 'No past sessions' : 'No sessions yet'}
                description={
                  tab === 1
                      ? 'Completed sessions will appear here.'
                      : 'Propose a session with one of your connections to get started.'
                }
                action={connections.length === 0 ? (
                    <Link to="/connections">
                      <Button variant="secondary"><Link2 size={14} /> Find Connections</Button>
                    </Link>
                ) : null}
            />
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sessions.map(session => (
                  <SessionCard
                      key={session.id}
                      session={session}
                      currentUserId={user?.id}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                      onMarkDone={handleMarkDone}
                      onReview={setReviewSession}
                  />
              ))}
            </div>
        )}

        {/* Modals */}
        {proposeConn && (
            <ProposeModal
                connection={proposeConn}
                onClose={() => setProposeConn(null)}
                onSuccess={() => { setProposeConn(null); load() }}
            />
        )}
        {reviewSession && (
            <ReviewModal
                session={reviewSession}
                onClose={() => setReviewSession(null)}
                onSuccess={() => { setReviewSession(null); load() }}
            />
        )}
      </div>
  )
}