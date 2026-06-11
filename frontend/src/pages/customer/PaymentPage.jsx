import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Copy, Check, X,
  Smartphone, Building2, Banknote,
  CreditCard, CheckCircle, FileImage
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

// ─── Payment methods ──────────────────────────────────────────────────────────
const METHODS = [
  {
    key:   'cash',
    icon:  <Banknote size={22} />,
    label: 'Cash',
    desc:  'Pay worker directly in cash',
    color: 'border-emerald-500 bg-emerald-500/5',
    active:'text-emerald-400',
    badge: 'Easiest',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    key:   'razorpay',
    icon:  <CreditCard size={22} />,
    label: 'Card / NetBanking',
    desc:  'Pay securely online via Razorpay',
    color: 'border-brand-500 bg-brand-500/5',
    active:'text-brand-400',
    badge: 'Instant',
    badgeColor: 'bg-brand-500/20 text-brand-400',
  },
  {
    key:   'upi_qr',
    icon:  <Smartphone size={22} />,
    label: 'UPI / QR Code',
    desc:  'GPay, PhonePe, Paytm',
    color: 'border-blue-500 bg-blue-500/5',
    active:'text-blue-400',
  },
  {
    key:   'bank',
    icon:  <Building2 size={22} />,
    label: 'Bank Transfer',
    desc:  'NEFT, IMPS, RTGS',
    color: 'border-purple-500 bg-purple-500/5',
    active:'text-purple-400',
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Copied!')
        setTimeout(() => setCopied(false), 2000)
      }}
      className="ml-2 p-1.5 rounded-lg bg-surface hover:bg-surface-border transition-colors flex-shrink-0"
    >
      {copied
        ? <Check size={13} className="text-emerald-400" />
        : <Copy size={13} className="text-surface-muted" />
      }
    </button>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-border last:border-0">
      <span className="text-surface-muted text-sm">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-white font-medium text-sm">{value}</span>
        <CopyButton text={String(value)} />
      </div>
    </div>
  )
}

export default function PaymentPage() {
  const { bookingId } = useParams()
  const navigate      = useNavigate()

  const [booking,    setBooking]    = useState(null)
  const [config,     setConfig]     = useState(null)
  const [method,     setMethod]     = useState('cash')
  const [txnId,      setTxnId]      = useState('')
  const [note,       setNote]       = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    api.get(`/bookings/${bookingId}/`).then(r => setBooking(r.data)).catch(() => navigate('/bookings'))
    api.get('/payments/config/').then(r => setConfig(r.data)).catch(() => setConfig({}))
  }, [bookingId])

  // ── File handling ────────────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file')
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile({ target: { files: [file] } })
  }

  // ── Razorpay ─────────────────────────────────────────────────────────────
  const handleRazorpay = async () => {
    setSubmitting(true)
    try {
      const { data } = await api.post('/payments/initiate/', {
        booking_id: bookingId,
        method:     'razorpay',
      })

      const rzp = new window.Razorpay({
        key:         data.key || data.order_id,
        amount:      data.amount,
        currency:    'INR',
        order_id:    data.order_id,
        name:        'LocalService Connect',
        description: `Booking #${bookingId} — ${booking?.service?.name}`,
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
            setSubmitted(true)
            toast.success('Payment successful! ✅')
          } catch {
            toast.error('Payment verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false)
            toast('Payment cancelled.', { icon: 'ℹ️' })
          }
        }
      })
      rzp.open()
    } catch (err) {
      setSubmitting(false)
      toast.error(err.response?.data?.error || 'Could not initiate payment. Try again.')
    }
  }

  // ── Cash / UPI / Bank submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    // Razorpay has its own flow
    if (method === 'razorpay') {
      await handleRazorpay()
      return
    }

    // Validation for non-cash methods
    if (method !== 'cash') {
      if (!txnId.trim())          return toast.error('Please enter the Transaction ID')
      if (txnId.trim().length < 6) return toast.error('Transaction ID seems too short')
      if (!screenshot)             return toast.error('Please upload your payment screenshot')
    }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('booking_id',     bookingId)
      fd.append('method',         method)
      fd.append('transaction_id', txnId.trim() || (method === 'cash' ? 'CASH' : ''))
      fd.append('customer_note',  note.trim())
      if (screenshot) fd.append('payment_screenshot', screenshot)

      await api.post('/payments/submit-proof/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSubmitted(true)
      toast.success(
        method === 'cash'
          ? 'Cash payment recorded!'
          : 'Payment submitted! Admin will verify shortly.'
      )
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed. Try again.')
    }
    setSubmitting(false)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!booking || !config) return (
    <div className="max-w-lg mx-auto space-y-4 pt-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
    </div>
  )

  const commission = Math.round((booking.final_price || 0) * 0.1)
  const workerGets = (booking.final_price || 0) - commission

  // ── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    const isRazorpay = method === 'razorpay'
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 pt-8 px-4">
        <div className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={36} className="text-emerald-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">
            {isRazorpay ? 'Payment Successful!' : method === 'cash' ? 'Cash Payment Recorded!' : 'Payment Submitted!'}
          </h1>
          <p className="text-surface-muted">
            {isRazorpay
              ? `₹${booking.final_price} paid successfully via Razorpay.`
              : method === 'cash'
              ? `Cash payment of ₹${booking.final_price} has been recorded.`
              : `Your payment of ₹${booking.final_price} has been submitted for verification.`
            }
          </p>
        </div>

        <div className="card text-left space-y-3">
          {[
            ['Booking',    `#${booking.id}`],
            ['Service',    booking.service?.name],
            ['Amount',     `₹${booking.final_price}`],
            ['Method',     METHODS.find(m => m.key === method)?.label],
            !isRazorpay && method !== 'cash' && ['Transaction ID', txnId],
            ['Status',     isRazorpay ? '✅ Paid' : method === 'cash' ? '⏳ Pending Confirmation' : '⏳ Pending Verification'],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-surface-muted">{k}</span>
              <span className="text-white font-medium">{v}</span>
            </div>
          ))}
        </div>

        {!isRazorpay && (
          <div className="card border-yellow-500/30 bg-yellow-500/5 text-sm text-left">
            <p className="text-yellow-400 font-semibold mb-1">⏳ What happens next?</p>
            <p className="text-surface-muted">
              {method === 'cash'
                ? 'Admin will confirm your cash payment and update your booking status.'
                : 'Admin will verify your payment screenshot within 30 minutes.'
              }
            </p>
          </div>
        )}

        <button onClick={() => navigate('/bookings')} className="btn-primary w-full py-4">
          View My Bookings
        </button>
      </div>
    )
  }

  // ── Main payment page ─────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-5 px-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <button onClick={() => navigate(`/bookings/${bookingId}`)} className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Make Payment</h1>
          <p className="text-surface-muted text-sm">Booking #{bookingId} · {booking.service?.name}</p>
        </div>
      </div>

      {/* Amount card */}
      <div className="card bg-gradient-to-r from-brand-500/10 to-orange-500/5 border-brand-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-surface-muted text-sm">Total Amount</p>
            <p className="text-4xl font-display font-bold text-white mt-1">₹{booking.final_price}</p>
            <p className="text-surface-muted text-xs mt-1">
              Service: {booking.service?.name} · Worker: {booking.worker?.name}
            </p>
          </div>
          <div className="text-right text-xs space-y-1.5">
            <p className="text-surface-muted">Platform fee</p>
            <p className="text-brand-400 font-semibold text-base">₹{commission}</p>
            <p className="text-surface-muted text-xs">Worker gets ₹{workerGets}</p>
          </div>
        </div>
      </div>

      {/* Step 1 — Choose method */}
      <div className="card space-y-3">
        <p className="font-semibold text-white flex items-center gap-2 mb-1">
          <span className="w-6 h-6 bg-brand-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
          Choose Payment Method
        </p>
        {METHODS.map(m => (
          <button
            key={m.key}
            onClick={() => setMethod(m.key)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
              method === m.key ? m.color : 'border-surface-border hover:border-slate-500'
            }`}
          >
            <span className={method === m.key ? m.active : 'text-surface-muted flex-shrink-0'}>
              {m.icon}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-semibold text-sm ${method === m.key ? 'text-white' : 'text-slate-300'}`}>
                  {m.label}
                </p>
                {m.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-muted mt-0.5">{m.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              method === m.key ? 'border-brand-500 bg-brand-500' : 'border-surface-border'
            }`}>
              {method === m.key && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </button>
        ))}
      </div>

      {/* ── Step 2 — Method-specific content ─────────────────────────────── */}

      {/* CASH */}
      {method === 'cash' && (
        <div className="card border-emerald-500/20 bg-emerald-500/5 space-y-3">
          <p className="font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
            Cash Payment Instructions
          </p>
          <div className="space-y-2.5">
            {[
              ['Pay', `₹${booking.final_price} directly to worker ${booking.worker?.name || ''}`],
              ['Then', 'Tap "Confirm Cash Payment" below to record it'],
              ['Note', `Platform collects ₹${commission} commission from the worker`],
            ].map(([num, text], i) => (
              <p key={i} className="flex items-start gap-3 text-sm text-surface-muted">
                <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                <span><strong className="text-white">{num}:</strong> {text}</span>
              </p>
            ))}
          </div>
          <div className="bg-surface rounded-xl p-3 flex justify-between items-center">
            <span className="text-surface-muted text-sm">Pay to worker</span>
            <span className="text-white font-bold text-lg">₹{booking.final_price}</span>
          </div>
        </div>
      )}

      {/* RAZORPAY */}
      {method === 'razorpay' && (
        <div className="card border-brand-500/20 bg-brand-500/5 space-y-4">
          <p className="font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
            Pay Online via Razorpay
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Amount',     `₹${booking.final_price}`],
              ['Platform fee', `₹${commission} (10%)`],
              ['Worker gets',  `₹${workerGets}`],
              ['Accepted',     'Card, UPI, Netbanking'],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface rounded-xl p-3">
                <p className="text-surface-muted text-xs">{k}</p>
                <p className="text-white font-semibold mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          <div className="bg-surface border border-surface-border rounded-xl p-3 text-xs text-surface-muted space-y-1">
            <p>🔒 Secured by Razorpay — India's trusted payment gateway</p>
            <p>✅ Instant payment confirmation</p>
            <p>💳 Supports Visa, Mastercard, RuPay, UPI, Netbanking</p>
          </div>
        </div>
      )}

      {/* UPI QR */}
      {method === 'upi_qr' && (
        <div className="card space-y-4">
          <p className="font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
            Pay via UPI
          </p>
          {config.upi_qr_image_url ? (
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-2xl">
                <img src={config.upi_qr_image_url} alt="UPI QR" className="w-48 h-48 object-contain" />
              </div>
              <p className="text-surface-muted text-xs text-center">
                Scan with GPay / PhonePe / Paytm to pay ₹{booking.final_price}
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-dashed border-surface-border rounded-xl py-6 text-center">
              <p className="text-surface-muted text-sm">QR not configured — use UPI ID below</p>
            </div>
          )}
          <div className="bg-surface rounded-xl p-4">
            <InfoRow label="UPI ID"   value={config.upi_id  || 'Not configured'} />
            <InfoRow label="Pay To"   value={config.upi_name || 'LocalService'} />
            <InfoRow label="Amount"   value={`₹${booking.final_price}`} />
          </div>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-surface-muted">
            Open GPay → Send Money → Enter UPI ID → Enter ₹{booking.final_price} → Pay → Take screenshot
          </div>
        </div>
      )}

      {/* BANK TRANSFER */}
      {method === 'bank' && (
        <div className="card space-y-4">
          <p className="font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
            Bank Transfer Details
          </p>
          <div className="bg-surface rounded-xl p-4">
            {config.bank_name           && <InfoRow label="Bank"           value={config.bank_name} />}
            {config.account_holder_name && <InfoRow label="Account Name"   value={config.account_holder_name} />}
            {config.account_number      && <InfoRow label="Account Number" value={config.account_number} />}
            {config.ifsc_code           && <InfoRow label="IFSC"           value={config.ifsc_code} />}
            {config.branch_name         && <InfoRow label="Branch"         value={config.branch_name} />}
            <InfoRow label="Amount" value={`₹${booking.final_price}`} />
          </div>
        </div>
      )}

      {/* Step 3 — Upload proof (UPI & Bank only) */}
      {(method === 'upi_qr' || method === 'bank') && (
        <div className="card space-y-4">
          <p className="font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-brand-500 rounded-full text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
            Upload Payment Proof
          </p>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">
              Transaction ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 407312345678 or UTR number"
              value={txnId}
              onChange={e => setTxnId(e.target.value)}
              className="input font-mono"
            />
            <p className="text-xs text-surface-muted mt-1">
              Found in your UPI app → Transaction History → Last transaction
            </p>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">
              Payment Screenshot <span className="text-red-400">*</span>
            </label>
            {!preview ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed border-surface-border hover:border-brand-500/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <FileImage size={32} className="mx-auto text-surface-muted mb-3" />
                <p className="text-white font-medium text-sm">Click to upload or drag & drop</p>
                <p className="text-surface-muted text-xs mt-1">PNG, JPG up to 5MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </div>
            ) : (
              <div className="relative">
                <img src={preview} alt="Screenshot" className="w-full rounded-xl border border-surface-border object-cover max-h-64" />
                <button
                  onClick={() => { setScreenshot(null); setPreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
                <div className="absolute bottom-2 left-2 bg-emerald-500 rounded-lg px-2 py-1 flex items-center gap-1">
                  <CheckCircle size={12} className="text-white" />
                  <span className="text-white text-xs font-medium">Screenshot added</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Note (optional)</label>
            <textarea
              rows={2}
              placeholder="Any additional info for admin…"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="input resize-none"
            />
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full py-4 text-base font-bold rounded-xl transition-all ${
          method === 'cash'     ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
          method === 'razorpay' ? 'btn-primary' :
          'btn-primary'
        } disabled:opacity-60`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {method === 'razorpay' ? 'Opening payment…' : 'Submitting…'}
          </span>
        ) : method === 'cash'     ? '✅ Confirm Cash Payment'
          : method === 'razorpay' ? '💳 Pay ₹' + booking.final_price + ' via Razorpay'
          : '📤 Submit Payment for Verification'
        }
      </button>

      <p className="text-center text-xs text-surface-muted pb-4">
        🔒 Payments are secure and reviewed by our team
      </p>
    </div>
  )
}
