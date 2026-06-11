import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { fetchMyBookings } from '../../store/slices/bookingsSlice'
import { CalendarDays, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE = {
  pending:     'badge-orange',
  accepted:    'badge-blue',
  in_progress: 'badge-blue',
  completed:   'badge-green',
  cancelled:   'badge-red',
  rejected:    'badge-red',
}

const STATUS_LABEL = {
  pending:     '⏳ Pending',
  accepted:    '✅ Accepted',
  in_progress: '🔧 In Progress',
  completed:   '✔️ Completed',
  cancelled:   '❌ Cancelled',
  rejected:    '❌ Rejected',
}

export default function MyBookingsPage() {
  const dispatch = useDispatch()
  const { myBookings, isLoading } = useSelector(s => s.bookings)

  // Always fetch fresh data when this page is visited
  useEffect(() => {
    dispatch(fetchMyBookings())
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">My Bookings</h1>
          <p className="text-surface-muted text-sm mt-1">{myBookings.length} total bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => dispatch(fetchMyBookings())}
            className="btn-secondary py-2.5 px-3"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <Link to="/" className="btn-primary py-2.5 px-4 flex items-center gap-2 text-sm">
            <Plus size={15} /> New Booking
          </Link>
        </div>
      </div>

      {isLoading && myBookings.length === 0 ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : myBookings.length === 0 ? (
        <div className="card text-center py-16">
          <CalendarDays size={40} className="mx-auto text-surface-muted mb-3" />
          <p className="text-white font-semibold">No bookings yet</p>
          <p className="text-surface-muted text-sm mt-1 mb-4">Book your first service today</p>
          <Link to="/" className="btn-primary">Browse Services</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myBookings.map(booking => (
            <Link
              key={booking.id}
              to={`/bookings/${booking.id}`}
              className="card flex items-center gap-4 hover:border-brand-500/40 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xl">
                🔧
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{booking.service?.name}</p>
                  <span className={STATUS_BADGE[booking.status] || 'badge-gray'}>
                    {STATUS_LABEL[booking.status] || booking.status}
                  </span>
                </div>
                <p className="text-sm text-surface-muted truncate mt-0.5">
                  {booking.problem_description}
                </p>
                <p className="text-xs text-surface-muted mt-1">
                  {format(new Date(booking.created_at), 'dd MMM yyyy, hh:mm a')}
                  {booking.final_price && ` · ₹${booking.final_price}`}
                </p>
              </div>
              <ChevronRight size={16} className="text-surface-muted group-hover:text-brand-400 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
