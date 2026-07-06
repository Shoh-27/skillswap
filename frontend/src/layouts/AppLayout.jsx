import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, Compass, Link2, MessageSquare,
  User, LogOut, Zap, Calendar, Users, TrendingUp, Sparkles,
} from 'lucide-react'
import NotificationsDropdown from '../components/NotificationsDropdown'

const NAV = [
  { to: '/dashboard',      label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/discover',       label: 'Discover',    icon: Compass },
  { to: '/connections',    label: 'Connections', icon: Link2 },
  { to: '/sessions',       label: 'Sessions',    icon: Calendar },
  { to: '/group-sessions', label: 'Groups',      icon: Users },
  { to: '/progress',       label: 'Progress',    icon: TrendingUp },
  { to: '/chat',           label: 'Chat',        icon: MessageSquare },
]

function Av({ name, size = 'md' }) {
  const grads = ['from-indigo-500 to-violet-600','from-sky-500 to-blue-600','from-emerald-500 to-teal-600','from-amber-500 to-orange-600']
  const g = grads[(name?.charCodeAt(0) || 0) % grads.length]
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm' }
  return (
    <div className={`${sz[size]} rounded-full bg-gradient-to-br ${g} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'}
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const linkCls = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 no-underline whitespace-nowrap ${
      isActive
        ? 'bg-indigo-50 text-indigo-600'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`

  const sideCls = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 no-underline ${
      isActive
        ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
    }`

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Topbar */}
      <header className="h-14 bg-white/90 backdrop-blur-md border-b border-slate-100 flex items-center px-5 gap-3 flex-shrink-0 z-50 sticky top-0">
        <NavLink to="/dashboard" className="flex items-center gap-2 no-underline mr-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-[16px] tracking-tight hidden sm:block">SkillSwap</span>
        </NavLink>

        <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-x-auto">
          {NAV.slice(0, 6).map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkCls}>{label}</NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NotificationsDropdown />
          <div className="w-px h-4 bg-slate-200 mx-0.5" />
          <Av name={user?.name} />
          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{user?.email}</p>
          </div>
          <button
            onClick={async () => { await logout(); navigate('/login') }}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all ml-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-white border-r border-slate-100 py-4 px-3 gap-0.5">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-3 mb-2">Navigation</p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={sideCls}>
              <Icon size={16} className="flex-shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="my-2 h-px bg-slate-100 mx-2" />
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-3 mb-2">Account</p>
          <NavLink to="/profile" className={sideCls}><User size={16} />Profile</NavLink>

          <div className="mt-auto pt-3">
            <button
              onClick={async () => { await logout(); navigate('/login') }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all w-full font-medium"
            >
              <LogOut size={16} />Log out
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile nav */}
      <nav className="flex lg:hidden bg-white border-t border-slate-100 py-1 safe-pb">
        {[...NAV.slice(0,5), { to: '/profile', label: 'Me', icon: User }].map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 flex-1 py-2 text-[9px] font-semibold tracking-tight no-underline transition-colors ${
              isActive ? 'text-indigo-600' : 'text-slate-400'
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
