import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, XCircle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'

const STATUS = {
  pending:  { badge: 'badge-orange', icon: <Clock size={12} />,       label: 'Pending Verification' },
  verified: { badge: 'badge-green',  icon: <CheckCircle size={12} />, label: 'Verified' },
  paid:     { badge: 'badge-green',  icon: <CheckCircle size={12} />, label: 'Paid' },
  rejected: { badge: 'badge-red',    icon: <XCircle size={12} />,     label: 'Rejected' },
}

const METHOD_LABEL = {
  upi_qr:   '📱 UPI',
  bank:     '🏦 Bank',
  cash:     '💵 Cash',
  razorpay: '💳 Card',
}

export default function PaymentHistoryPage() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.get('/payments/history/')
      .then(r => setPayments(Array.isArray(r.data) ? r.data : r.data.results || []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/bookings')} className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Payment History</h1>
          <p className="text-surface-muted text-sm mt-0.5">{payments.length} payments</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">💳</p>
          <p className="text-white font-semibold">No payment history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map(p => {
            const s = STATUS[p.status] || STATUS.pending
            return (
              <div key={p.id} className="card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-white text-sm">{p.service_name}</p>
                    <span className={`${s.badge} flex items-center gap-1`}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-surface-muted">
                    {METHOD_LABEL[p.method]} · ₹{p.amount}
                    {p.transaction_id ? ` · TXN: ${p.transaction_id}` : ''}
                  </p>
                  <p className="text-xs text-surface-muted mt-0.5">
                    {format(new Date(p.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>
                  {p.status === 'rejected' && p.rejection_reason && (
                    <p className="text-xs text-red-400 mt-1">❌ {p.rejection_reason}</p>
                  )}
                  {p.status === 'verified' && p.verified_at && (
                    <p className="text-xs text-emerald-400 mt-1">
                      ✅ Verified {format(new Date(p.verified_at), 'dd MMM, hh:mm a')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelected(p)}
                  className="btn-secondary py-2 px-3 flex-shrink-0"
                >
                  <Eye size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Payment Details</h3>
              <button onClick={() => setSelected(null)} className="text-surface-muted hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Service',        selected.service_name],
                ['Amount',         `₹${selected.amount}`],
                ['Method',         METHOD_LABEL[selected.method]],
                ['Transaction ID', selected.transaction_id || '—'],
                ['Status',         STATUS[selected.status]?.label],
                ['Submitted',      format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm a')],
                selected.verified_at && ['Verified at', format(new Date(selected.verified_at), 'dd MMM yyyy, hh:mm a')],
                selected.rejection_reason && ['Rejection reason', selected.rejection_reason],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-surface-border last:border-0">
                  <span className="text-surface-muted">{k}</span>
                  <span className="text-white font-medium text-right max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            {selected.screenshot_url && (
              <div className="mt-4">
                <p className="text-xs text-surface-muted mb-2">Payment Screenshot:</p>
                <img
                  src={selected.screenshot_url}
                  alt="Payment proof"
                  className="w-full rounded-xl border border-surface-border"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
