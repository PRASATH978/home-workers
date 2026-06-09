import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Phone } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const STATUS_COLOR = {
  pending: 'text-orange-400', accepted: 'text-blue-400',
  in_progress: 'text-blue-400', completed: 'text-emerald-400',
  cancelled: 'text-red-400', rejected: 'text-red-400',
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    api.get(`/bookings/${id}/`).then(r => setBooking(r.data))
  }, [id])

  const handleReview = async () => {
    setIsSubmittingReview(true)
    try {
      await api.post(`/bookings/${id}/review/`, { rating, comment })
      toast.success('Review submitted!')
      setBooking(b => ({ ...b, has_review: true }))
    } catch {
      toast.error('Failed to submit review')
    }
    setIsSubmittingReview(false)
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return
    setIsCancelling(true)
    try {
      await api.delete(`/bookings/${id}/`)
      toast.success('Booking cancelled')
      navigate('/bookings')
    } catch {
      toast.error('Cannot cancel this booking')
    }
    setIsCancelling(false)
  }

  const handlePayment = () => {
    api.post(`/payments/booking/${id}/`).then(({ data }) => {
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'LocalService Connect',
        description: `Booking #${id}`,
        handler: async (response) => {
          try {
            await api.post('/payments/verify/', {
              ...response,
              payment_id: data.payment_id,
            })
            toast.success('Payment successful!')
            setBooking(b => ({ ...b, payment_status: 'paid' }))
          } catch {
            toast.error('Payment verification failed')
          }
        },
        theme: { color: '#f97316' },
      })
      rzp.open()
    })
  }

  if (!booking) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/bookings')} className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-2xl font-bold text-white">Booking #{booking.id}</h1>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-lg font-bold ${STATUS_COLOR[booking.status]}`}>
            {booking.status.replace('_', ' ').toUpperCase()}
          </span>
          {booking.final_price && (
            <span className="text-xl font-bold text-white">₹{booking.final_price}</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-surface-muted">Service</span>
            <span className="text-white font-medium">{booking.service?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-muted">Booked on</span>
            <span className="text-white">{format(new Date(booking.created_at), 'dd MMM yyyy, hh:mm a')}</span>
          </div>
          {booking.accepted_at && (
            <div className="flex justify-between">
              <span className="text-surface-muted">Accepted at</span>
              <span className="text-white">{format(new Date(booking.accepted_at), 'hh:mm a')}</span>
            </div>
          )}
          {booking.completed_at && (
            <div className="flex justify-between">
              <span className="text-surface-muted">Completed at</span>
              <span className="text-white">{format(new Date(booking.completed_at), 'dd MMM, hh:mm a')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Problem & Address */}
      <div className="card space-y-3">
        <div>
          <p className="text-xs text-surface-muted uppercase tracking-wider mb-1">Problem</p>
          <p className="text-white">{booking.problem_description}</p>
        </div>
        <div>
          <p className="text-xs text-surface-muted uppercase tracking-wider mb-1">Address</p>
          <p className="text-white">{booking.address}</p>
        </div>
      </div>

      {/* Worker info */}
      {booking.worker && (
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
              {booking.worker.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{booking.worker.name}</p>
              <p className="text-xs text-surface-muted">{booking.worker.city}</p>
            </div>
          </div>
          <a href={`tel:${booking.worker.phone}`} className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-sm">
            <Phone size={14} /> Call
          </a>
        </div>
      )}

      {/* Payment */}
      {booking.status === 'completed' && booking.payment_status === 'unpaid' && (
        <div className="card border-brand-500/30">
          <p className="text-white font-semibold mb-3">💳 Pay Now</p>
          <p className="text-surface-muted text-sm mb-4">Amount due: ₹{booking.final_price}</p>
          <button onClick={handlePayment} className="btn-primary w-full">
            Pay ₹{booking.final_price} via Razorpay
          </button>
        </div>
      )}
      {booking.payment_status === 'paid' && (
        <div className="card border-emerald-500/30 text-center py-4">
          <p className="text-emerald-400 font-semibold">✅ Payment Done</p>
        </div>
      )}

      {/* Review */}
      {booking.status === 'completed' && !booking.has_review && (
        <div className="card">
          <p className="text-white font-semibold mb-4">⭐ Rate your experience</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={28} className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-border'} />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            placeholder="Tell us how it went…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="input resize-none mb-3"
          />
          <button onClick={handleReview} disabled={isSubmittingReview} className="btn-primary w-full">
            {isSubmittingReview ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      )}
      {booking.has_review && (
        <div className="card text-center py-4">
          <p className="text-emerald-400 font-semibold">✅ Review submitted</p>
        </div>
      )}

      {/* Cancel */}
      {booking.status === 'pending' && (
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
        >
          {isCancelling ? 'Cancelling…' : 'Cancel Booking'}
        </button>
      )}
    </div>
  )
}
