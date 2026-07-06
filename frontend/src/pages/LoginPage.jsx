import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button, Input } from '../components/ui'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [showPass, setShowPass] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const res = await login(form)
    if (res.success) navigate('/dashboard')
    else setErrors(res.errors)
  }

  return (
    <div className="w-full max-w-[420px] animate-fade-up">
      <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(79,70,229,0.12),0_2px_8px_rgba(0,0,0,0.06)] p-10 border border-slate-100">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">SkillSwap</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-400 mb-8">Sign in to continue your skill journey</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            icon={Mail}
            error={errors.email?.[0]}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={16} /></div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password?.[0] && <p className="text-xs text-rose-500">{errors.password[0]}</p>}
          </div>

          <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
            Sign in
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-300">or</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <p className="text-sm text-center text-slate-500">
          New to SkillSwap?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
