import { useEffect, useState, useCallback } from 'react'
import {
  Search, ShieldCheck, ShieldOff, Ban, CheckCircle2, Trash2,
  ChevronLeft, ChevronRight, Star,
} from 'lucide-react'
import { adminApi } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { Avatar, Badge, Spinner, EmptyState, Button } from '../../components/ui'

function ConfirmDialog({ title, description, confirmLabel, danger, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-1.5">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{description}</p>
        <div className="flex gap-2">
          <Button
            variant={danger ? 'danger' : 'primary'}
            loading={loading}
            className="flex-1"
            onClick={async () => { setLoading(true); try { await onConfirm() } finally { setLoading(false) } }}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onClose}>Bekor qilish</Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [banned, setBanned] = useState('')
  const [page, setPage] = useState(1)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.users.list({ search: search || undefined, role: role || undefined, banned, page })
      .then(r => { setUsers(r.data.data); setMeta(r.data.meta) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [search, role, banned, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, role, banned])

  const act = async (fn) => { await fn(); setConfirm(null); load() }

  return (
    <div className="p-6 md:p-8 max-w-6xl animate-fade-in">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Foydalanuvchilar</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Rollarni boshqaring, bloklang yoki o'chiring</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text" placeholder="Ism yoki email bo'yicha qidirish..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]">
          <option value="">Barcha rollar</option>
          <option value="user">Foydalanuvchi</option>
          <option value="admin">Admin</option>
        </select>
        <select value={banned} onChange={e => setBanned(e.target.value)}
          className="px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]">
          <option value="">Barcha holatlar</option>
          <option value="0">Faol</option>
          <option value="1">Bloklangan</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : users.length === 0 ? (
        <EmptyState icon="🔍" title="Foydalanuvchi topilmadi" description="Filtrlarni o'zgartirib ko'ring." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                  <th className="px-4 py-3 font-semibold hidden sm:table-cell">Rol</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Reyting</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Sessiyalar</th>
                  <th className="px-4 py-3 font-semibold">Holat</th>
                  <th className="px-4 py-3 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isMe = u.id === me?.id
                  return (
                    <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-white truncate max-w-[160px]">{u.name}{isMe && <span className="text-slate-400 font-normal"> (siz)</span>}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[160px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={u.role === 'admin' ? 'violet' : 'gray'}>{u.role === 'admin' ? 'Admin' : 'Foydalanuvchi'}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-300">
                        {u.total_reviews > 0 ? (
                          <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{u.avg_rating.toFixed(1)} <span className="text-slate-400">({u.total_reviews})</span></span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-300">{u.total_sessions}</td>
                      <td className="px-4 py-3">
                        {u.is_banned ? <Badge variant="rose">Bloklangan</Badge> : <Badge variant="emerald">Faol</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title={u.role === 'admin' ? 'Adminlikdan olish' : 'Admin qilish'}
                            disabled={isMe && u.role === 'admin'}
                            onClick={() => setConfirm({
                              title: u.role === 'admin' ? 'Adminlikdan olish' : 'Admin etib tayinlash',
                              description: u.role === 'admin' ? `${u.name} endi oddiy foydalanuvchi bo'ladi.` : `${u.name} endi to'liq admin huquqlariga ega bo'ladi.`,
                              confirmLabel: 'Tasdiqlash',
                              onConfirm: () => act(() => adminApi.users.role(u.id, u.role === 'admin' ? 'user' : 'admin')),
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/40 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          >
                            {u.role === 'admin' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                          </button>
                          <button
                            title={u.is_banned ? 'Blokdan chiqarish' : 'Bloklash'}
                            disabled={isMe}
                            onClick={() => setConfirm({
                              title: u.is_banned ? 'Blokdan chiqarish' : 'Foydalanuvchini bloklash',
                              description: u.is_banned ? `${u.name} qaytadan tizimga kira oladi.` : `${u.name} tizimga kira olmaydi va joriy sessiyalari bekor qilinadi.`,
                              confirmLabel: u.is_banned ? 'Blokdan chiqarish' : 'Bloklash',
                              danger: !u.is_banned,
                              onConfirm: () => act(() => u.is_banned ? adminApi.users.unban(u.id) : adminApi.users.ban(u.id)),
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          >
                            {u.is_banned ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                          </button>
                          <button
                            title="O'chirish"
                            disabled={isMe}
                            onClick={() => setConfirm({
                              title: 'Foydalanuvchini o\'chirish',
                              description: `${u.name} butunlay o'chiriladi. Bu amalni orqaga qaytarib bo'lmaydi.`,
                              confirmLabel: 'O\'chirish',
                              danger: true,
                              onConfirm: () => act(() => adminApi.users.delete(u.id)),
                            })}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-all disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400">{meta.total} tadan {meta.from}-{meta.to}</p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-slate-500 px-2">{meta.current_page} / {meta.last_page}</span>
                <button disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {confirm && (
        <ConfirmDialog {...confirm} onClose={() => setConfirm(null)} />
      )}
    </div>
  )
}
