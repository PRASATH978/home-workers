import { useEffect, useState } from 'react'
import adminApi from '../../utils/adminApi'
import { Search } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]       = useState('')

  useEffect(() => {
    // Pull all bookings and extract unique customers
    adminApi.get('/workers/bookings-all/')
      .then(res => {
        const bookings = Array.isArray(res.data) ? res.data : res.data.results || []
        const seen = new Map()

        bookings.forEach(b => {
          if (!b.customer) return
          const id = b.customer.id
          if (!seen.has(id)) {
            seen.set(id, {
              ...b.customer,
              total_bookings: 0,
              completed_bookings: 0,
              total_spent: 0,
              last_booking: b.created_at,
            })
          }
          const c = seen.get(id)
          c.total_bookings += 1
          if (b.status === 'completed') c.completed_bookings += 1
          if (b.payment_status === 'paid' && b.final_price) c.total_spent += b.final_price
          // Keep most recent booking date
          if (new Date(b.created_at) > new Date(c.last_booking)) {
            c.last_booking = b.created_at
          }
        })

        setCustomers(Array.from(seen.values()))
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = customers.filter(c =>
    !search
    || c.name?.toLowerCase().includes(search.toLowerCase())
    || c.phone?.includes(search)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Customers</h1>
        <p className="text-surface-muted text-sm mt-1">{customers.length} customers with bookings</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
        <input
          type="text"
          placeholder="Search by name or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Customer', 'Phone', 'City', 'Bookings', 'Completed', 'Total Spent', 'Verified', 'Last Booking'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-surface-muted">
                      No customers found
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs flex-shrink-0">
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{c.phone}</td>
                    <td className="px-4 py-3 text-sm text-surface-muted">{c.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="badge-blue">{c.total_bookings}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-green">{c.completed_bookings}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-400 font-medium">
                      {c.total_spent > 0 ? `₹${c.total_spent.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.is_phone_verified
                        ? <span className="badge-green">✓ Yes</span>
                        : <span className="badge-red">✗ No</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-surface-muted whitespace-nowrap">
                      {format(new Date(c.last_booking), 'dd MMM yyyy')}
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
