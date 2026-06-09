import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Wrench, CalendarDays,
  CreditCard, Shield, LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard',  icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/workers',    icon: <Shield size={18} />,          label: 'Workers' },
  { to: '/admin/customers',  icon: <Users size={18} />,           label: 'Customers' },
  { to: '/admin/bookings',   icon: <CalendarDays size={18} />,    label: 'Bookings' },
  { to: '/admin/payments',   icon: <CreditCard size={18} />,      label: 'Payments' },
  { to: '/admin/services',   icon: <Wrench size={18} />,          label: 'Services' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const admin = JSON.parse(localStorage.getItem('admin_user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('admin_user')
    navigate('/admin')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm">LocalService</p>
          <p className="text-xs text-brand-400 font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(item => {
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="px-3 py-4 border-t border-surface-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-sm font-bold flex-shrink-0">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin?.name || 'Admin'}</p>
            <p className="text-xs text-surface-muted truncate">{admin?.phone}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-card border-r border-surface-border fixed h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-surface-card border-r border-surface-border z-50">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-surface-card border-b border-surface-border px-6 h-16 flex items-center justify-between sticky top-0 z-20">
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="hidden lg:block">
            <p className="text-white font-semibold capitalize">
              {location.pathname.split('/').pop().replace('-', ' ')}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative text-slate-400 hover:text-white">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full text-xs text-white flex items-center justify-center font-bold">3</span>
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
