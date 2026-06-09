import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchWorkerProfile } from '../../store/slices/workersSlice'
import { fetchWorkerJobs } from '../../store/slices/bookingsSlice'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { toggleAvailability } from '../../store/slices/workersSlice'
import { Briefcase, Star, TrendingUp, Crown, ToggleLeft, ToggleRight, ChevronRight, AlertCircle } from 'lucide-react'

export default function WorkerDashboard() {
  const dispatch = useDispatch()
  const { profile } = useSelector(s => s.workers)
  const { availableJobs } = useSelector(s => s.bookings)
  const user = useSelector(s => s.auth.user)

  useEffect(() => {
    dispatch(fetchWorkerProfile())
    dispatch(fetchWorkerJobs('available'))
  }, [])

  const handleToggle = async () => {
    try {
      await api.post('/workers/profile/toggle-availability/')
      dispatch(toggleAvailability())
      toast.success(profile?.is_available ? 'You are now offline' : 'You are now online')
    } catch {
      toast.error('Failed to update status')
    }
  }

  if (!profile) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}
    </div>
  )

  const isPending = profile.verification_status === 'pending'
  const isRejected = profile.verification_status === 'rejected'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Hi, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-surface-muted text-sm mt-1">
            {profile.verification_status === 'verified' ? '✅ Verified Worker' : `⚠️ Verification: ${profile.verification_status}`}
          </p>
        </div>
        {/* Online toggle */}
        <button onClick={handleToggle} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all ${
          profile.is_available
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-surface-card border-surface-border text-surface-muted'
        }`}>
          {profile.is_available
            ? <><ToggleRight size={18} /> Online</>
            : <><ToggleLeft size={18} /> Offline</>
          }
        </button>
      </div>

      {/* Verification warning */}
      {(isPending || isRejected) && (
        <div className={`card border ${isRejected ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className={isRejected ? 'text-red-400' : 'text-yellow-400'} />
            <div>
              <p className="font-semibold text-white text-sm">
                {isRejected ? 'Verification rejected' : 'Verification pending'}
              </p>
              <p className="text-surface-muted text-xs mt-1">
                {isRejected
                  ? `Reason: ${profile.verification_note || 'Contact support'}`
                  : 'Your ID is being reviewed. You can still complete your profile.'}
              </p>
              {isPending && (
                <Link to="/worker/profile" className="text-brand-400 text-xs font-medium mt-2 inline-block">
                  Complete profile →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Briefcase size={18} />, label: 'Total Jobs', value: profile.total_jobs },
          { icon: <Star size={18} />, label: 'Rating', value: `${profile.avg_rating || 0} ★` },
          { icon: <TrendingUp size={18} />, label: 'Reviews', value: profile.rating_count },
          { icon: <Crown size={18} />, label: 'Plan', value: profile.subscription_plan?.toUpperCase() },
        ].map(stat => (
          <div key={stat.label} className="card flex flex-col items-center text-center py-4">
            <div className="text-brand-400 mb-1">{stat.icon}</div>
            <div className="font-display text-xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-surface-muted mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Available Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-white">
            Available Jobs <span className="text-brand-400">({availableJobs.length})</span>
          </h2>
          <Link to="/worker/jobs" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {availableJobs.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-white font-medium">No jobs available right now</p>
            <p className="text-surface-muted text-sm mt-1">Stay online to receive job notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableJobs.slice(0, 3).map(job => (
              <div key={job.id} className="card flex items-center gap-4">
                <div className="flex-1">
                  <p className="font-semibold text-white">{job.service?.name}</p>
                  <p className="text-sm text-surface-muted truncate">{job.problem_description}</p>
                  <p className="text-xs text-surface-muted mt-1">📍 {job.address?.slice(0, 60)}…</p>
                </div>
                <Link to={`/worker/jobs`} className="btn-primary py-2 px-4 text-sm flex-shrink-0">
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upgrade CTA */}
      {profile.subscription_plan === 'basic' && (
        <div className="card border-brand-500/30 bg-gradient-to-r from-brand-500/10 to-orange-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-white flex items-center gap-2">
                <Crown size={16} className="text-brand-400" /> Upgrade Your Plan
              </p>
              <p className="text-surface-muted text-sm mt-1">Get unlimited leads for ₹199/month</p>
            </div>
            <Link to="/worker/subscribe" className="btn-primary py-2 px-4 text-sm">
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
