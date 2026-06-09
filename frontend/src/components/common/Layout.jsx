import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import {
  Home, Briefcase, CalendarDays, User,
  LogOut, Menu, X, Wrench, Star
} from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(s => s.auth.user)
  const [menuOpen, setMenuOpen] = useState(false)

  const isWorker = user?.role === 'worker'

  const navLinks = isWorker
    ? [
        { to: '/worker', icon: <Home size={18} />, label: 'Dashboard' },
        { to: '/worker/jobs', icon: <Briefcase size={18} />, label: 'Jobs' },
        { to: '/worker/profile', icon: <User size={18} />, label: 'Profile' },
        { to: '/worker/subscribe', icon: <Star size={18} />, label: 'Upgrade' },
      ]
    : [
        { to: '/', icon: <Home size={18} />, label: 'Home' },
        { to: '/bookings', icon: <CalendarDays size={18} />, label: 'Bookings' },
        { to: '/workers', icon: <Briefcase size={18} />, label: 'Workers' },
      ]

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-surface-card border-b border-surface-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to={isWorker ? '/worker' : '/'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-glow">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">
              Local<span className="text-brand-500">Service</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-sm font-semibold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary py-2 px-3 flex items-center gap-2 text-sm">
              <LogOut size={15} />
              <span className="hidden md:inline">Logout</span>
            </button>
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-border px-4 py-3 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-brand-500/10 text-brand-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border py-6 text-center text-sm text-surface-muted">
        © {new Date().getFullYear()} LocalService Connect · Built for Krishnagiri & Tamil Nadu
      </footer>
    </div>
  )
}
