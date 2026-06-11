import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkerJobs, workerJobAction } from '../../store/slices/bookingsSlice'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { MapPin, Phone, CheckCircle, RefreshCw } from 'lucide-react'

const TABS = [
  { key: 'available', label: 'Available' },
  { key: 'mine',      label: 'My Jobs' },
]

export default function WorkerJobsPage() {
  const dispatch = useDispatch()
  const { availableJobs, myJobs, isLoading } = useSelector(s => s.bookings)
  const [tab, setTab] = useState('available')
  const [otpInput, setOtpInput] = useState({})
  const [actionLoading, setActionLoading] = useState(null)

  const load = (t = tab) => dispatch(fetchWorkerJobs(t))

  // Always fetch fresh on mount
  useEffect(() => {
    load('available')
    load('mine')
  }, [])

  // Re-fetch when tab changes
  useEffect(() => {
    load(tab)
  }, [tab])

  const jobs = tab === 'available' ? availableJobs : myJobs

  const handleAction = async (bookingId, action, extra = {}) => {
    setActionLoading(`${bookingId}-${action}`)
    const res = await dispatch(workerJobAction({ bookingId, action, ...extra }))
    setActionLoading(null)
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(`Job ${action}ed successfully`)
      load('available')
      load('mine')
    } else {
      toast.error(res.payload?.error || `Failed to ${action} job`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Jobs</h1>
          <p className="text-surface-muted text-sm mt-1">Manage your service requests</p>
        </div>
        <button onClick={() => { load('available'); load('mine') }} className="btn-secondary py-2.5 px-3">
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-surface-card rounded-xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
            <span className="opacity-70">
              ({t.key === 'available' ? availableJobs.length : myJobs.length})
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card text-center py-14">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-white font-medium">
            {tab === 'available' ? 'No available jobs right now' : 'No active jobs'}
          </p>
          <p className="text-surface-muted text-sm mt-1">
            {tab === 'available' ? 'Stay online to receive notifications' : 'Accept a job from the Available tab'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="card space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{job.service?.name}</p>
                  <p className="text-sm text-surface-muted mt-0.5">{job.problem_description}</p>
                </div>
                <span className={`badge flex-shrink-0 ${
                  job.status === 'pending'     ? 'badge-orange' :
                  job.status === 'accepted'    ? 'badge-blue'   :
                  job.status === 'in_progress' ? 'badge-blue'   :
                  job.status === 'completed'   ? 'badge-green'  : 'badge-gray'
                }`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-muted">
                <span className="flex items-center gap-1"><MapPin size={11} /> {job.address}</span>
                {job.customer?.phone && (
                  <a href={`tel:${job.customer.phone}`} className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
                    <Phone size={11} /> {job.customer.phone}
                  </a>
                )}
                <span>📅 {format(new Date(job.created_at), 'dd MMM, hh:mm a')}</span>
                {job.final_price && <span className="text-emerald-400 font-medium">₹{job.final_price}</span>}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {job.status === 'pending' && (
                  <button
                    onClick={() => handleAction(job.id, 'accept')}
                    disabled={actionLoading === `${job.id}-accept`}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    {actionLoading === `${job.id}-accept` ? '…' : '✅ Accept Job'}
                  </button>
                )}

                {job.status === 'accepted' && (
                  <button
                    onClick={() => handleAction(job.id, 'start')}
                    disabled={actionLoading === `${job.id}-start`}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    {actionLoading === `${job.id}-start` ? '…' : '▶️ Start Job'}
                  </button>
                )}

                {job.status === 'in_progress' && (
                  <div className="flex items-center gap-2 w-full flex-wrap">
                    <input
                      type="text"
                      placeholder="Customer OTP"
                      maxLength={4}
                      value={otpInput[job.id] || ''}
                      onChange={e => setOtpInput(p => ({ ...p, [job.id]: e.target.value }))}
                      className="input w-36 py-2 text-center tracking-widest font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Final price ₹"
                      onChange={e => setOtpInput(p => ({ ...p, [`${job.id}_price`]: e.target.value }))}
                      className="input w-36 py-2"
                    />
                    <button
                      onClick={() => handleAction(job.id, 'complete', {
                        otp: otpInput[job.id],
                        final_price: otpInput[`${job.id}_price`],
                      })}
                      disabled={actionLoading === `${job.id}-complete`}
                      className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
                    >
                      <CheckCircle size={15} />
                      {actionLoading === `${job.id}-complete` ? '…' : 'Mark Complete'}
                    </button>
                  </div>
                )}

                {job.status === 'completed' && (
                  <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
                    <CheckCircle size={15} /> Job completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
