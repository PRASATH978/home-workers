import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Shield, Phone, Lock, ArrowRight } from 'lucide-react'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ phone: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await api.post('/auth/login/', form)
      const user = res.data.user
      if (user.role !== 'admin') {
        toast.error('Access denied. Admin only.')
        setIsLoading(false)
        return
      }
      localStorage.setItem('access', res.data.access)
      localStorage.setItem('refresh', res.data.refresh)
      localStorage.setItem('admin_user', JSON.stringify(user))
      toast.success('Welcome to Admin Panel')
      navigate('/admin/dashboard')
    } catch {
      toast.error('Invalid phone or password')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500 rounded-2xl shadow-glow mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Admin Panel</h1>
          <p className="text-surface-muted mt-1">LocalService Connect</p>
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
              {isLoading ? 'Signing in…' : <> Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
