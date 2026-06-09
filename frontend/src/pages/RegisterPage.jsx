import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { register } from '../store/slices/authSlice'
import { Wrench, Phone, Lock, User, ArrowRight, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ phone: '', name: '', password: '', role: 'customer' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await dispatch(register(form))
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Account created!')
      navigate(form.role === 'worker' ? '/worker' : '/')
    } else {
      const err = res.payload
      const msg = err?.phone?.[0] || err?.password?.[0] || err?.detail || 'Registration failed'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl shadow-glow mb-4">
            <Wrench size={26} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
          <p className="text-surface-muted mt-1">Join LocalService Connect</p>
        </div>

        <div className="card">
          {/* Role Toggle */}
          <div className="flex gap-2 p-1 bg-surface rounded-xl mb-5">
            {['customer', 'worker'].map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setForm({ ...form, role })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  form.role === role
                    ? 'bg-brand-500 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {role === 'customer' ? <User size={15} /> : <Briefcase size={15} />}
                {role === 'customer' ? 'I need services' : 'I am a worker'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input
                  type="text"
                  placeholder="Ravi Kumar"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading ? 'Creating account…' : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-surface-muted mt-4">
            Have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
