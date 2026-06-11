import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, CheckCircle, CreditCard } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

// ─── Change these to your actual business details ─────────────────────────────
const BUSINESS_PHONE  = '9000000000'
const WHATSAPP_NUMBER = '919000000000'  // country code + number, no +
// ─────────────────────────────────────────────────────────────────────────────

export default function SimplePaymentPage() {
  const { bookingId } = useParams()
  const navigate      = useNavigate()

  const [booking,  setBooking]  = useState(null)
  const [screen,   setScreen]   = useState('main')   // main | cash | razorpay | whatsapp
  const [saving,   setSaving]   = useState(false)
  const [done,     setDone]     = useState(false)
  const [doneMethod, setDoneMethod] = useState('')

  useEffect(() => {
    api.get(`/bookings/${bookingId}/`)
      .then(r => setBooking(r.data))
      .catch(() => navigate('/bookings'))
  }, [bookingId])

  // ── Record payment in backend ─────────────────────────────────────────────
  const recordPayment = async (method, txnRef = '') => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('booking_id',     bookingId)
      fd.append('method',         method)
      fd.append('transaction_id', txnRef || method.toUpperCase())
      await api.post('/payments/submit-proof/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setDoneMethod(method)
      setDone(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong. Try again.')
    }
    setSaving(false)
  }

  // ── Razorpay ──────────────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/payments/initiate/', {
        booking_id: bookingId,
        method:     'razorpay',
      })

      setSaving(false)

      const rzp = new window.Razorpay({
        key:         data.key,
        amount:      data.amount,
        currency:    'INR',
        order_id:    data.order_id,
        name:        'LocalService Connect',
        description: `Booking #${bookingId}`,
        prefill: {
          name:    booking?.customer?.name  || '',
          contact: booking?.customer?.phone || '',
        },
        theme: { color: '#f97316' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify/razorpay/', {
              ...response,
              payment_id: data.payment_id,
            })
            setDoneMethod('razorpay')
            setDone(true)
            toast.success('Payment successful!')
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.', { icon: 'ℹ️' })
          }
        }
      })
      rzp.open()
    } catch (err) {
      setSaving(false)
      toast.error(err.response?.data?.error || 'Could not open payment. Try again.')
    }
  }

  if (!booking) return (
    <div className="max-w-sm mx-auto pt-10 px-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-20 bg-surface-card rounded-2xl animate-pulse" />
      ))}
    </div>
  )

  const commission = Math.round((booking.final_price || 0) * 0.1)

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    const msgs = {
      cash:     { emoji: '💵', title: 'Cash Payment Noted!', sub: 'Admin will confirm shortly.' },
      razorpay: { emoji: '✅', title: 'Payment Successful!', sub: 'Your booking is now paid.' },
      whatsapp: { emoji: '💬', title: 'WhatsApp Noted!',     sub: 'Admin will confirm shortly.' },
    }
    const m = msgs[doneMethod] || msgs.cash

    return (
      <div className="max-w-sm mx-auto px-4 pt-16 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-500/15 border-4 border-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={44} className="text-emerald-400" />
        </div>
        <div>
          <div className="text-4xl mb-2">{m.emoji}</div>
          <h1 className="text-white text-2xl font-bold">{m.title}</h1>
          <p className="text-surface-muted mt-2">{m.sub}</p>
        </div>
        <div className="card text-left space-y-2.5">
          {[
            ['Booking',  `#${booking.id}`],
            ['Service',  booking.service?.name],
            ['Amount',   `₹${booking.final_price}`],
            ['Status',   doneMethod === 'razorpay' ? '✅ Paid' : '⏳ Pending Confirmation'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-surface-muted">{k}</span>
              <span className="text-white font-medium">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate('/bookings')} className="btn-primary w-full py-4 text-base">
          Done ✓
        </button>
      </div>
    )
  }

  // ── Cash confirm screen ───────────────────────────────────────────────────
  if (screen === 'cash') {
    return (
      <div className="max-w-sm mx-auto px-4 pt-10 space-y-5">
        <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-surface-muted text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center">
          <div className="text-5xl mb-3">💵</div>
          <h2 className="text-white text-xl font-bold">Cash Payment</h2>
          <p className="text-surface-muted mt-1 text-sm">Confirm you paid the worker in cash</p>
        </div>

        <div className="card space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-surface-muted text-sm">Pay to worker</span>
            <span className="text-white font-semibold">{booking.worker?.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-surface-border">
            <span className="text-surface-muted text-sm">Amount</span>
            <span className="text-3xl font-bold text-white">₹{booking.final_price}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-t border-surface-border">
            <span className="text-surface-muted text-xs">Platform commission (collected from worker)</span>
            <span className="text-brand-400 text-sm font-medium">₹{commission}</span>
          </div>
        </div>

        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-sm text-surface-muted">
          Tap below to confirm you paid
          <strong className="text-white"> ₹{booking.final_price} cash </strong>
          to <strong className="text-white">{booking.worker?.name}</strong>.
        </div>

        <button
          onClick={() => recordPayment('cash')}
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl text-lg transition-colors disabled:opacity-60"
        >
          {saving
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Please wait…
              </span>
            : '✅ Yes, I Paid Cash'
          }
        </button>
      </div>
    )
  }

  // ── Razorpay confirm screen ───────────────────────────────────────────────
  if (screen === 'razorpay') {
    return (
      <div className="max-w-sm mx-auto px-4 pt-10 space-y-5">
        <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-surface-muted text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center">
          <div className="text-5xl mb-3">💳</div>
          <h2 className="text-white text-xl font-bold">Pay Online</h2>
          <p className="text-surface-muted mt-1 text-sm">Card, UPI, Netbanking — all accepted</p>
        </div>

        <div className="card space-y-3">
          {[
            ['Booking',     `#${booking.id}`],
            ['Service',     booking.service?.name],
            ['Amount',      `₹${booking.final_price}`],
            ['Platform fee', `₹${commission} (10%)`],
            ['Worker gets', `₹${booking.final_price - commission}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-surface-muted">{k}</span>
              <span className="text-white font-medium">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-3 text-xs text-surface-muted space-y-1">
          <p>🔒 Secured by Razorpay</p>
          <p>✅ Instant confirmation after payment</p>
          <p>💳 Visa · Mastercard · RuPay · UPI · Netbanking</p>
        </div>

        <button
          onClick={handleRazorpay}
          disabled={saving}
          className="btn-primary w-full py-5 text-lg font-bold disabled:opacity-60"
        >
          {saving
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Opening payment…
              </span>
            : `💳 Pay ₹${booking.final_price} Now`
          }
        </button>
      </div>
    )
  }

  // ── WhatsApp screen ───────────────────────────────────────────────────────
  if (screen === 'whatsapp') {
    const msg = encodeURIComponent(
      `Hi, I want to confirm payment for my booking.\n\n` +
      `Booking ID: #${booking.id}\n` +
      `Service: ${booking.service?.name}\n` +
      `Amount: ₹${booking.final_price}\n` +
      `Worker: ${booking.worker?.name || ''}\n\n` +
      `Please confirm receipt.`
    )

    return (
      <div className="max-w-sm mx-auto px-4 pt-10 space-y-5">
        <button onClick={() => setScreen('main')} className="flex items-center gap-2 text-surface-muted text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center">
          <div className="text-5xl mb-3">💬</div>
          <h2 className="text-white text-xl font-bold">Pay via WhatsApp</h2>
          <p className="text-surface-muted mt-1 text-sm">
            Send payment to <strong className="text-white">+91 {BUSINESS_PHONE}</strong>
          </p>
        </div>

        <div className="card space-y-2 text-sm">
          {[
            ['Amount',  `₹${booking.final_price}`],
            ['Booking', `#${booking.id}`],
            ['To',      `+91 ${BUSINESS_PHONE}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-surface-border last:border-0">
              <span className="text-surface-muted">{k}</span>
              <span className="text-white font-medium">{v}</span>
            </div>
          ))}
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20b858] text-white font-bold py-5 rounded-2xl text-lg transition-colors"
        >
          💬 Open WhatsApp
        </a>

        <button
          onClick={() => recordPayment('whatsapp')}
          disabled={saving}
          className="w-full btn-secondary py-4 text-base"
        >
          {saving ? 'Saving…' : '✓ I Already Paid on WhatsApp'}
        </button>
      </div>
    )
  }

  // ── Main screen — 4 big buttons ───────────────────────────────────────────
  return (
    <div className="max-w-sm mx-auto px-4 pt-6 pb-10 space-y-6">
      <button
        onClick={() => navigate(`/bookings/${bookingId}`)}
        className="flex items-center gap-2 text-surface-muted text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Amount */}
      <div className="text-center py-4">
        <p className="text-surface-muted text-sm mb-1">Total Amount</p>
        <p className="text-5xl font-display font-bold text-white">₹{booking.final_price}</p>
        <p className="text-surface-muted text-sm mt-2">
          {booking.service?.name} · {booking.worker?.name}
        </p>
      </div>

      <p className="text-center text-surface-muted text-sm font-medium">
        How would you like to pay?
      </p>

      {/* 4 big buttons */}
      <div className="grid grid-cols-2 gap-4">

        {/* Cash — always first */}
        <button
          onClick={() => setScreen('cash')}
          className="flex flex-col items-center justify-center gap-3 bg-emerald-500/10 hover:bg-emerald-500/20 border-2 border-emerald-500/40 hover:border-emerald-500 rounded-2xl py-8 px-4 transition-all active:scale-95"
        >
          <span className="text-5xl">💵</span>
          <div className="text-center">
            <p className="text-white font-bold text-base">Cash</p>
            <p className="text-emerald-400 text-xs mt-0.5">Pay worker directly</p>
          </div>
        </button>

        {/* Razorpay */}
        <button
          onClick={() => setScreen('razorpay')}
          className="flex flex-col items-center justify-center gap-3 bg-brand-500/10 hover:bg-brand-500/20 border-2 border-brand-500/40 hover:border-brand-500 rounded-2xl py-8 px-4 transition-all active:scale-95"
        >
          <span className="text-5xl">💳</span>
          <div className="text-center">
            <p className="text-white font-bold text-base">Card / UPI</p>
            <p className="text-brand-400 text-xs mt-0.5">Pay online</p>
          </div>
        </button>

        {/* WhatsApp */}
        <button
          onClick={() => setScreen('whatsapp')}
          className="flex flex-col items-center justify-center gap-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border-2 border-[#25D366]/40 hover:border-[#25D366] rounded-2xl py-8 px-4 transition-all active:scale-95"
        >
          <span className="text-5xl">💬</span>
          <div className="text-center">
            <p className="text-white font-bold text-base">WhatsApp</p>
            <p className="text-[#25D366] text-xs mt-0.5">Send payment</p>
          </div>
        </button>

        {/* Call */}
        <a
          href={`tel:${BUSINESS_PHONE}`}
          className="flex flex-col items-center justify-center gap-3 bg-blue-500/10 hover:bg-blue-500/20 border-2 border-blue-500/40 hover:border-blue-500 rounded-2xl py-8 px-4 transition-all active:scale-95"
        >
          <span className="text-5xl">📞</span>
          <div className="text-center">
            <p className="text-white font-bold text-base">Call Us</p>
            <p className="text-blue-400 text-xs mt-0.5">We'll help you pay</p>
          </div>
        </a>
      </div>

      <p className="text-center text-xs text-surface-muted leading-relaxed">
        Not sure? Call{' '}
        <a href={`tel:${BUSINESS_PHONE}`} className="text-brand-400 font-semibold">
          {BUSINESS_PHONE}
        </a>{' '}
        — we will help you complete the payment.
      </p>
    </div>
  )
}
