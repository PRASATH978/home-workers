import { useEffect, useState } from 'react'
import adminApi from '../../utils/adminApi'
import { Users, CalendarDays, CreditCard, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

function StatCard({ icon, label, value, color = 'brand' }) {
  const colors = {
    brand:  'bg-brand-500/10 text-brand-400 border-brand-500/20',
    green:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-display font-bold text-white">{value}</p>
        <p className="text-sm text-surface-muted">{label}</p>
      </div>
    </div>
  )
}

const STATUS_BADGE = {
  pending:     'badge-orange',
  accepted:    'badge-blue',
  in_progress: 'badge-blue',
  completed:   'badge-green',
  cancelled:   'badge-red',
  rejected:    'badge-red',
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([])
  const [workers, setWorkers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.get('/workers/bookings-all/').catch(() => ({ data: [] })),
      adminApi.get('/workers/all/').catch(() => ({ data: [] })),
    ]).then(([bookingsRes, workersRes]) => {
      const bList = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : bookingsRes.data.results || []
      const wList = Array.isArray(workersRes.data)
        ? workersRes.data
        : workersRes.data.results || []
      setBookings(bList)
      setWorkers(wList)
      setIsLoading(false)
    })
  }, [])

  const stats = {
    totalBookings: bookings.length,
    completed:     bookings.filter(b => b.status === 'completed').length,
    pending:       bookings.filter(b => b.status === 'pending').length,
    totalWorkers:  workers.length,
    verified:      workers.filter(w => w.verification_status === 'verified').length,
    pendingVerify: workers.filter(w => w.verification_status === 'pending').length,
    revenue:       bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((s, b) => s + (b.commission_amount || 0), 0),
  }

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 8)

  const topWorkers = [...workers]
    .filter(w => w.verification_status === 'verified')
    .sort((a, b) => (b.total_jobs || 0) - (a.total_jobs || 0))
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-surface-muted text-sm mt-1">
          {stats.pendingVerify > 0 && (
            <span className="text-yellow-400 font-medium">
              ⚠️ {stats.pendingVerify} worker{stats.pendingVerify > 1 ? 's' : ''} pending verification ·{' '}
            </span>
          )}
          {stats.pending} bookings waiting for workers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<CalendarDays size={20} />} label="Total Bookings"    value={stats.totalBookings} color="brand"  />
        <StatCard icon={<CheckCircle size={20} />}  label="Completed Jobs"    value={stats.completed}     color="green"  />
        <StatCard icon={<Users size={20} />}         label="Verified Workers"  value={`${stats.verified} / ${stats.totalWorkers}`} color="blue" />
        <StatCard icon={<CreditCard size={20} />}   label="Commission Earned" value={`₹${stats.revenue.toLocaleString()}`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Bookings</h2>
            <span className="badge-orange">{stats.pending} pending</span>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-surface-muted text-sm text-center py-8">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {recentBookings.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-surface-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      #{b.id} — {b.service?.name}
                    </p>
                    <p className="text-xs text-surface-muted truncate">
                      {b.customer?.name} · {b.address?.slice(0, 40)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`${STATUS_BADGE[b.status] || 'badge-gray'} capitalize`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-surface-muted">
                      {format(new Date(b.created_at), 'dd MMM')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Workers */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4">
            Top Workers
            {stats.pendingVerify > 0 && (
              <span className="ml-2 badge-orange">{stats.pendingVerify} pending</span>
            )}
          </h2>
          {topWorkers.length === 0 ? (
            <p className="text-surface-muted text-sm text-center py-8">No workers yet</p>
          ) : (
            <div className="space-y-3">
              {topWorkers.map(w => (
                <div key={w.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
                    {w.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{w.name}</p>
                    <p className="text-xs text-surface-muted truncate">
                      {w.service_names?.slice(0, 2).join(', ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-yellow-400">
                      ⭐ {w.avg_rating?.toFixed(1) || '0.0'}
                    </p>
                    <p className="text-xs text-surface-muted">{w.total_jobs} jobs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
