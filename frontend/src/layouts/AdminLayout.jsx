import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Users, LayoutGrid, LogOut, ShieldCheck, ArrowLeftCircle,
} from 'lucide-react'

const NAV = [
  { to: '/admin',          label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users',    label: 'Users',      icon: Users },
  { to: '/admin/content',  label: 'Content',    icon: LayoutGrid },
]

function Av({ name }) {
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm ring-2 ring-amber-400/40">
      {name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const sideCls = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
      isActive
        ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md'
        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
    }`

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950">
      {/* Topbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-5 gap-3 flex-shrink-0 z-50 sticky top-0">
        <Link to="/admin" className="flex items-center gap-2 no-underline mr-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
            <ShieldCheck size={16} className="text-slate-900" />
          </div>
          <span className="font-bold text-white text-[16px] tracking-tight hidden sm:block">Admin Panel</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline ${
                isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }>{label}</NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link to="/dashboard" className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors no-underline">
            <ArrowLeftCircle size={14} /> Ilovaga qaytish
          </Link>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <Av name={user?.name} />
          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[10px] text-slate-400">Administrator</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-950/60 hover:text-rose-400 transition-all ml-1"
            title="Chiqish"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-slate-900 py-4 px-3 gap-0.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Boshqaruv</p>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sideCls}>
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile nav */}
      <nav className="flex md:hidden bg-slate-900 border-t border-slate-800 py-1 safe-pb">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 flex-1 py-2 text-[9px] font-semibold tracking-tight no-underline transition-colors ${
              isActive ? 'text-amber-400' : 'text-slate-500'
            }`
          }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
