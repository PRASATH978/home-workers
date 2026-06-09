import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { format } from 'date-fns'
import { TrendingUp, CreditCard, IndianRupee } from 'lucide-react'

export default function AdminPaymentsPage() {
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.get('/bookings/').then(res => {
      const all = res.data.results || res.data || []
      setBookings(all.filter(b => b.final_price))
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.final_price || 0), 0)
  const totalCommission = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.commission_amount || 0), 0)
  const unpaidAmount = bookings.filter(b => b.payment_status === 'unpaid').reduce((s, b) => s + (b.final_price || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Payments</h1>
        <p className="text-surface-muted text-sm mt-1">Revenue and commission overview</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: <IndianRupee size={20} />, label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { icon: <TrendingUp size={20} />,  label: 'Commission Earned', value: `₹${totalCommission.toLocaleString()}`, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
          { icon: <CreditCard size={20} />,  label: 'Pending Collection', value: `₹${unpaidAmount.toLocaleString()}`, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-surface-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="card h-14 animate-pulse" />)}</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Booking', 'Service', 'Customer', 'Worker', 'Amount', 'Commission', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {bookings.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-surface-muted">No payment records yet</td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-sm text-brand-400 font-mono">#{b.id}</td>
                    <td className="px-4 py-3 text-sm text-white">{b.service?.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{b.customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{b.worker?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">₹{b.final_price}</td>
                    <td className="px-4 py-3 text-sm text-brand-400">
                      {b.commission_amount ? `₹${b.commission_amount}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {b.payment_status === 'paid'
                        ? <span className="badge-green">✓ Paid</span>
                        : <span className="badge-orange">Unpaid</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-muted whitespace-nowrap">
                      {format(new Date(b.created_at), 'dd MMM yyyy')}
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
