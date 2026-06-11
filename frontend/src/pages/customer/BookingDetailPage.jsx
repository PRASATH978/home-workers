import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Star, Phone, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { usePolling } from '../../hooks/usePolling'

const STATUS_COLOR = {
  pending:     'text-orange-400',
  accepted:    'text-blue-400',
  in_progress: 'text-blue-400',
  completed:   'text-emerald-400',
  cancelled:   'text-red-400',
  rejected:    'text-red-400',
}
const STATUS_LABEL = {
  pending:     '⏳ Pending',
  accepted:    '✅ Accepted',
  in_progress: '🔧 In Progress',
  completed:   '✔️ Completed',
  cancelled:   '❌ Cancelled',
  rejected:    '❌ Rejected',
}

export default function BookingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking]   = useState(null)
  const [rating,  setRating]    = useState(5)
  const [comment, setComment]   = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isCancelling,       setIsCancelling]       = useState(false)
  const [otpCopied, setOtpCopied] = useState(false)

  const loadBooking = () =>
    api.get(`/bookings/${id}/`).then(r => setBooking(r.data)).catch(() => {})

  useEffect(() => { loadBooking() }, [id])
  usePolling(loadBooking, 8000, !!id)

  const copyOtp = () => {
    if (booking?.completion_otp) {
      navigator.clipboard.writeText(booking.completion_otp)
      setOtpCopied(true)
      toast.success('OTP copied!')
      setTimeout(() => setOtpCopied(false), 2000)
    }
  }

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

  if (!booking) return (
    <div className="max-w-xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
    </div>
  )

  const needsPayment = booking.status === 'completed' &&
    (booking.payment_status === 'unpaid')

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/bookings')} className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-2xl font-bold text-white">Booking #{booking.id}</h1>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-emerald-400">Live</span>
        </span>
      </div>

      {/* Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-lg font-bold ${STATUS_COLOR[booking.status]}`}>
            {STATUS_LABEL[booking.status] || booking.status}
          </span>
          {booking.final_price && (
            <span className="text-xl font-bold text-white">₹{booking.final_price}</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
          {[
            ['Service',   booking.service?.name],
            ['Booked on', format(new Date(booking.created_at), 'dd MMM yyyy, hh:mm a')],
            booking.accepted_at  && ['Accepted',  format(new Date(booking.accepted_at),  'dd MMM, hh:mm a')],
            booking.started_at   && ['Started',   format(new Date(booking.started_at),   'dd MMM, hh:mm a')],
            booking.completed_at && ['Completed', format(new Date(booking.completed_at), 'dd MMM, hh:mm a')],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-surface-muted">{k}</span>
              <span className="text-white font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OTP Box */}
      {booking.status === 'in_progress' && booking.completion_otp && (
        <div className="card border-brand-500/40 bg-brand-500/5">
          <p className="text-white font-semibold mb-1">🔐 Share this OTP with the worker</p>
          <p className="text-surface-muted text-xs mb-3">Worker needs this to mark job as completed</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-surface border-2 border-brand-500 rounded-xl py-4 text-center">
              <span className="text-4xl font-bold tracking-[0.3em] text-brand-400 font-mono">
                {booking.completion_otp}
              </span>
            </div>
            <button onClick={copyOtp} className="btn-secondary py-4 px-4 flex flex-col items-center gap-1">
              {otpCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              <span className="text-xs">{otpCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

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

      {/* Worker */}
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

      {/* Payment button — links to dedicated payment page */}
      {needsPayment && (
        <div className="card border-brand-500/30 bg-brand-500/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold">💳 Payment Required</p>
            <span className="text-xl font-bold text-brand-400">₹{booking.final_price}</span>
          </div>
          <p className="text-surface-muted text-sm mb-4">
            Pay via UPI, Bank Transfer or Cash. Upload payment proof for verification.
          </p>
          <Link to={`/simple-pay/${booking.id}`} className="btn-primary w-full text-center block text-base py-3">
            Pay Now →
          </Link>
        </div>
      )}

      {/* Pending verification */}
      {booking.payment_status === 'pending' && (
        <div className="card border-yellow-500/30 bg-yellow-500/5 text-center py-4">
          <p className="text-yellow-400 font-semibold">⏳ Payment Pending Verification</p>
          <p className="text-surface-muted text-xs mt-1">Admin will verify within 30 minutes</p>
        </div>
      )}

      {/* Paid */}
      {booking.payment_status === 'paid' && (
        <div className="card border-emerald-500/30 bg-emerald-500/5 text-center py-4">
          <p className="text-emerald-400 font-semibold text-lg">✅ Payment Done</p>
          <Link to="/payments/history" className="text-brand-400 text-xs mt-1 inline-block">
            View payment history →
          </Link>
        </div>
      )}

      {/* Review */}
      {booking.status === 'completed' && !booking.has_review && (
        <div className="card">
          <p className="text-white font-semibold mb-4">⭐ Rate your experience</p>
          <div className="flex gap-2 mb-3">
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star size={28} className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-surface-border'} />
              </button>
            ))}
          </div>
          <textarea rows={3} placeholder="Tell us how it went…" value={comment}
            onChange={e => setComment(e.target.value)} className="input resize-none mb-3" />
          <button onClick={handleReview} disabled={isSubmittingReview} className="btn-primary w-full">
            {isSubmittingReview ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      )}
      {booking.has_review && (
        <div className="card text-center py-4">
          <p className="text-emerald-400 font-semibold">✅ Review submitted — Thank you!</p>
        </div>
      )}

      {/* Cancel */}
      {booking.status === 'pending' && (
        <button onClick={handleCancel} disabled={isCancelling}
          className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
          {isCancelling ? 'Cancelling…' : 'Cancel Booking'}
        </button>
      )}
    </div>
  )
}
