import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { adminApi } from '../../services/api'
import { useToast } from '../../hooks/useToast'
import { Tabs, Badge, Avatar, Spinner, EmptyState, Button, Input, ToastContainer } from '../../components/ui'

const SESSION_BADGE = { proposed: 'sky', confirmed: 'indigo', done: 'emerald', cancelled: 'rose' }
const GROUP_BADGE   = { upcoming: 'sky', live: 'emerald', done: 'gray', cancelled: 'rose' }

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/* ── Skills tab ── */
function SkillsTab({ toast }) {
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.skills.list().then(r => setSkills(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const addSkill = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    try {
      await adminApi.skills.create(name.trim())
      setName('')
      load()
    } catch (err) {
      toast({ title: 'Xatolik', description: err.response?.data?.message || 'Ko\'nikma qo\'shilmadi.', variant: 'error' })
    } finally { setAdding(false) }
  }

  const removeSkill = async (skill) => {
    try {
      await adminApi.skills.delete(skill.id)
      load()
    } catch (err) {
      toast({ title: 'O\'chirib bo\'lmadi', description: err.response?.data?.message || 'Bu ko\'nikma foydalanuvchilar tomonidan ishlatilmoqda.', variant: 'error' })
    }
  }

  return (
    <div>
      <form onSubmit={addSkill} className="flex gap-2 mb-5 max-w-sm">
        <Input placeholder="Yangi ko'nikma nomi" value={name} onChange={e => setName(e.target.value)} />
        <Button type="submit" loading={adding}><Plus size={15} /> Qo'shish</Button>
      </form>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : skills.length === 0 ? (
        <EmptyState icon="📚" title="Ko'nikmalar yo'q" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {skills.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{s.teach_count} o'rgatadi · {s.learn_count} o'rganmoqchi</p>
              </div>
              <button
                onClick={() => removeSkill(s)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-all flex-shrink-0"
                title="O'chirish"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Sessions tab (1:1) ── */
function SessionsTab({ toast }) {
  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.sessions.list({ status: status || undefined }).then(r => setSessions(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [status])
  useEffect(() => { load() }, [load])

  const remove = async (id) => {
    try { await adminApi.sessions.delete(id); load() }
    catch { toast({ title: 'Xatolik', description: 'Sessiya o\'chirilmadi.', variant: 'error' }) }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Barcha holatlar</option>
          <option value="proposed">Taklif qilingan</option>
          <option value="confirmed">Tasdiqlangan</option>
          <option value="done">Tugagan</option>
          <option value="cancelled">Bekor qilingan</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : sessions.length === 0 ? (
        <EmptyState icon="📅" title="Sessiyalar topilmadi" />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Sarlavha</th>
                <th className="px-4 py-3 font-semibold">Ishtirokchilar</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Sana</th>
                <th className="px-4 py-3 font-semibold">Holat</th>
                <th className="px-4 py-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{s.title || s.skill_tag || `Sessiya #${s.id}`}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{s.sender?.name || '?'} ↔ {s.receiver?.name || '?'}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 text-xs">{fmtDate(s.proposed_at)}</td>
                  <td className="px-4 py-3"><Badge variant={SESSION_BADGE[s.status] || 'gray'}>{s.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-all" title="O'chirish">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Group sessions tab ── */
function GroupSessionsTab({ toast }) {
  const [sessions, setSessions] = useState([])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.groupSessions.list({ status: status || undefined }).then(r => setSessions(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [status])
  useEffect(() => { load() }, [load])

  const remove = async (id) => {
    try { await adminApi.groupSessions.delete(id); load() }
    catch { toast({ title: 'Xatolik', description: 'Guruh sessiyasi o\'chirilmadi.', variant: 'error' }) }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Barcha holatlar</option>
          <option value="upcoming">Kutilmoqda</option>
          <option value="live">Jonli</option>
          <option value="done">Tugagan</option>
          <option value="cancelled">Bekor qilingan</option>
        </select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : sessions.length === 0 ? (
        <EmptyState icon="👥" title="Guruh sessiyalari topilmadi" />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 font-semibold">Sarlavha</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Host</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Ishtirokchilar</th>
                <th className="px-4 py-3 font-semibold">Holat</th>
                <th className="px-4 py-3 font-semibold text-right">Amal</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-[200px] truncate">{s.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 text-xs">{s.host?.name || '?'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400 text-xs">{s.participants_count}/{s.max_participants}</td>
                  <td className="px-4 py-3"><Badge variant={GROUP_BADGE[s.status] || 'gray'}>{s.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-all" title="O'chirish">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Reviews tab (moderation) ── */
function ReviewsTab({ toast }) {
  const [reviews, setReviews] = useState([])
  const [lowOnly, setLowOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.reviews.list({ max_rating: lowOnly ? 2 : undefined }).then(r => setReviews(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [lowOnly])
  useEffect(() => { load() }, [load])

  const remove = async (id) => {
    try { await adminApi.reviews.delete(id); load() }
    catch { toast({ title: 'Xatolik', description: 'Sharh o\'chirilmadi.', variant: 'error' }) }
  }

  return (
    <div>
      <div className="mb-5">
        <button
          onClick={() => setLowOnly(v => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            lowOnly ? 'bg-rose-600 text-white border-rose-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-300'
          }`}
        >
          Faqat past baholar (≤2 ★)
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} /></div> : reviews.length === 0 ? (
        <EmptyState icon="⭐" title="Sharhlar topilmadi" />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3">
              <Avatar name={r.reviewer?.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{r.reviewer?.name}</p>
                  <span className="text-xs text-slate-400">→ {r.reviewee?.name}</span>
                  <span className="flex items-center text-amber-400 text-xs ml-auto">
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                </div>
                {r.comment && <p className="text-sm text-slate-500 dark:text-slate-400">{r.comment}</p>}
              </div>
              <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-all flex-shrink-0" title="O'chirish">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminContentPage() {
  const [tab, setTab] = useState(0)
  const { toasts, toast, dismiss } = useToast()
  const tabs = ['Ko\'nikmalar', 'Sessiyalar', 'Guruh sessiyalari', 'Sharhlar']

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Kontent boshqaruvi</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Ko'nikmalar, sessiyalar va sharhlarni moderatsiya qiling</p>
      </div>

      <div className="mb-6 max-w-lg">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {tab === 0 && <SkillsTab toast={toast} />}
      {tab === 1 && <SessionsTab toast={toast} />}
      {tab === 2 && <GroupSessionsTab toast={toast} />}
      {tab === 3 && <ReviewsTab toast={toast} />}

      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  )
}
