import { Loader2, X, Star } from 'lucide-react'
import { forwardRef } from 'react'

// ── Button ─────────────────────────────────────────────────────────────────
const variants = {
  primary:   'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.45)] hover:-translate-y-px active:translate-y-0',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
  ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger:    'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
  success:   'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
  outline:   'border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
  indigo:    'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100',
}
const sizes = {
  xs: 'px-2.5 py-1.5 text-xs rounded-lg gap-1',
  sm: 'px-3.5 py-2 text-sm rounded-xl gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-2xl gap-2',
}

export function Button({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

// ── Input ──────────────────────────────────────────────────────────────────
export const Input = forwardRef(function Input({ label, error, icon: Icon, hint, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {Icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={16} /></div>}
        <input
          ref={ref}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} pr-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 ${error ? 'border-rose-300 focus:ring-rose-300/30 focus:border-rose-400' : 'border-slate-200 hover:border-slate-300'} ${className}`}
          {...props}
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500 flex items-center gap-1"><X size={12} />{error}</p>}
    </div>
  )
})

// ── Textarea ───────────────────────────────────────────────────────────────
export const Textarea = forwardRef(function Textarea({ label, error, className = '', ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        ref={ref}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none ${error ? 'border-rose-300' : 'border-slate-200 hover:border-slate-300'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
})

// ── Card ────────────────────────────────────────────────────────────────────
export function Card({ className = '', hover = false, children, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-100 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] ${
        hover ? 'hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:border-indigo-100 transition-all duration-300 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// ── Badge ───────────────────────────────────────────────────────────────────
const badgeMap = {
  indigo:   'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  violet:   'bg-violet-50 text-violet-700 border-violet-200/80',
  emerald:  'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  amber:    'bg-amber-50 text-amber-700 border-amber-200/80',
  rose:     'bg-rose-50 text-rose-600 border-rose-200/80',
  gray:     'bg-slate-100 text-slate-600 border-slate-200/80',
  sky:      'bg-sky-50 text-sky-700 border-sky-200/80',
}

export function Badge({ variant = 'gray', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeMap[variant]} ${className}`}>
      {children}
    </span>
  )
}

// ── SkillTag ─────────────────────────────────────────────────────────────────
export function SkillTag({ name, type = 'teach', onRemove }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150 ${
      type === 'teach'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
        : 'bg-violet-50 text-violet-700 border-violet-200/80'
    }`}>
      {name}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 hover:opacity-60 transition-opacity">
          <X size={11} />
        </button>
      )}
    </span>
  )
}

// ── Avatar ───────────────────────────────────────────────────────────────────
const gradients = [
  'from-indigo-500 to-violet-600',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-sky-600',
]

export function Avatar({ name = '?', size = 'md', className = '' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const grad = gradients[name.charCodeAt(0) % gradients.length]
  const sz = {
    xs:  'w-7 h-7 text-[11px]',
    sm:  'w-8 h-8 text-xs',
    md:  'w-10 h-10 text-sm',
    lg:  'w-14 h-14 text-lg',
    xl:  'w-20 h-20 text-2xl',
    '2xl': 'w-28 h-28 text-3xl',
  }
  return (
    <div className={`${sz[size]} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
      {tabs.map((tab, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            active === i
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ── StarRating ───────────────────────────────────────────────────────────────
export function StarRating({ rating, count, size = 'sm' }) {
  if (!rating && !count) return null
  const starSize = size === 'sm' ? 'text-sm' : 'text-base'
  if (count === 0) return <span className="text-xs text-slate-400">No reviews</span>
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1,2,3,4,5].map(s => (
          <span key={s} className={`${starSize} ${s <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
        ))}
      </div>
      <span className="text-xs text-slate-400">{rating?.toFixed(1)} <span className="text-slate-300">({count})</span></span>
    </div>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-5xl mb-4 opacity-80">{icon}</div>}
      <h3 className="font-semibold text-slate-700 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-indigo-500 ${className}`} />
}

// ── Toast ─────────────────────────────────────────────────────────────────────
export function ToastContainer({ toasts, dismiss }) {
  if (!toasts?.length) return null
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-up min-w-[260px] max-w-[340px] ${
            t.variant === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-900 text-white'
          }`}
        >
          <div className="flex-1">
            {t.title && <p className="font-semibold">{t.title}</p>}
            {t.description && <p className="opacity-75 text-xs mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="opacity-50 hover:opacity-100 transition-opacity mt-0.5">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-100" />
        <div className="flex-1">
          <div className="h-4 bg-slate-100 rounded-lg w-2/3 mb-2" />
          <div className="h-3 bg-slate-100 rounded-lg w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-100 rounded-lg mb-2 ${i === lines-1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}
