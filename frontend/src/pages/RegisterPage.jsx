import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button, Input } from '../components/ui'

export default function RegisterPage() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    const res = await register(form)
    if (res.success) navigate('/dashboard')
    else setErrors(res.errors)
  }

  return (
    <div className="w-full max-w-[440px] animate-fade-up">
      <div className="bg-white rounded-3xl shadow-[0_24px_64px_rgba(79,70,229,0.12),0_2px_8px_rgba(0,0,0,0.06)] p-10 border border-slate-100">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">SkillSwap</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Create account</h1>
        <p className="text-sm text-slate-400 mb-8">Start exchanging skills with amazing people</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Full Name" type="text" placeholder="Alex Morgan"
            value={form.name} onChange={set('name')} icon={User} error={errors.name?.[0]} required />
          <Input label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} icon={Mail} error={errors.email?.[0]} required />
          <Input label="Password" type="password" placeholder="Min. 8 characters"
            value={form.password} onChange={set('password')} icon={Lock} error={errors.password?.[0]} required />
          <Input label="Confirm Password" type="password" placeholder="••••••••"
            value={form.password_confirmation} onChange={set('password_confirmation')} icon={Lock} required />

          <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
            Create account
          </Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-300">or</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <p className="text-sm text-center text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
