import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../store/slices/authSlice'
import { Wrench, Phone, Lock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ phone: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await dispatch(login(form))
    if (res.meta.requestStatus === 'fulfilled') {
      const user = res.payload.user
      toast.success(`Welcome back, ${user.name}!`)
      navigate(user.role === 'worker' ? '/worker' : '/')
    } else {
      toast.error(res.payload?.non_field_errors?.[0] || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-500 rounded-2xl shadow-glow mb-4">
            <Wrench size={26} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-surface-muted mt-1">Sign in to LocalService Connect</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input pl-10"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {isLoading ? 'Signing in…' : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-surface-muted mt-4">
            No account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
