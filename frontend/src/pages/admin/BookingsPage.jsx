import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE = {
  pending:     'badge-orange',
  accepted:    'badge-blue',
  in_progress: 'badge-blue',
  completed:   'badge-green',
  cancelled:   'badge-red',
  rejected:    'badge-red',
}

const PAYMENT_BADGE = {
  unpaid:   'badge-orange',
  paid:     'badge-green',
  refunded: 'badge-blue',
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/bookings/').then(res => {
      setBookings(res.data.results || res.data || [])
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.id).includes(search)
    return matchFilter && matchSearch
  })

  const statuses = ['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Bookings</h1>
        <p className="text-surface-muted text-sm mt-1">{bookings.length} total bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
          <input
            type="text"
            placeholder="Search by ID, service, customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input w-44 capitalize"
        >
          {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Pending',   count: bookings.filter(b => b.status === 'pending').length,   cls: 'badge-orange' },
          { label: 'Active',    count: bookings.filter(b => b.status === 'in_progress').length, cls: 'badge-blue' },
          { label: 'Completed', count: bookings.filter(b => b.status === 'completed').length,  cls: 'badge-green' },
          { label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length,  cls: 'badge-red' },
        ].map(s => (
          <span key={s.label} className={`${s.cls} text-sm px-3 py-1.5`}>
            {s.label}: {s.count}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  {['#', 'Service', 'Customer', 'Worker', 'Address', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-surface-muted">No bookings found</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-sm text-brand-400 font-mono">#{b.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white whitespace-nowrap">{b.service?.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{b.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{b.worker?.name || <span className="text-surface-muted">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-xs text-surface-muted max-w-36 truncate">{b.address}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{b.final_price ? `₹${b.final_price}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`${STATUS_BADGE[b.status] || 'badge-gray'} capitalize whitespace-nowrap`}>
                        {b.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${PAYMENT_BADGE[b.payment_status] || 'badge-gray'} capitalize`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-muted whitespace-nowrap">
                      {format(new Date(b.created_at), 'dd MMM yy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
