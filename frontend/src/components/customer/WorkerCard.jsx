import { Link } from 'react-router-dom'
import { Star, MapPin, Briefcase, Crown, CheckCircle } from 'lucide-react'

export default function WorkerCard({ worker, serviceSlug }) {
  return (
    <div className={`card relative flex gap-4 hover:border-brand-500/40 transition-all ${worker.is_featured ? 'border-brand-500/50 shadow-glow' : ''}`}>
      {worker.is_featured && (
        <div className="absolute top-3 right-3 flex items-center gap-1 badge-orange">
          <Crown size={11} /> Featured
        </div>
      )}

      {/* Avatar */}
      <div className="flex-shrink-0">
        {worker.profile_photo ? (
          <img src={worker.profile_photo} alt={worker.name} className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xl font-bold">
            {worker.name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-white truncate">{worker.name}</h3>
          {worker.is_available ? (
            <span className="badge-green text-xs">● Online</span>
          ) : (
            <span className="badge-gray text-xs">Offline</span>
          )}
        </div>

        <div className="flex items-center gap-1 mt-1">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-medium text-white">{worker.avg_rating?.toFixed(1) || 'New'}</span>
          <span className="text-xs text-surface-muted">({worker.rating_count} reviews)</span>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <span className="flex items-center gap-1 text-xs text-surface-muted">
            <Briefcase size={11} /> {worker.total_jobs} jobs done
          </span>
          {worker.city && (
            <span className="flex items-center gap-1 text-xs text-surface-muted">
              <MapPin size={11} /> {worker.city}
            </span>
          )}
          {worker.distance_km && worker.distance_km < 999 && (
            <span className="flex items-center gap-1 text-xs text-surface-muted">
              📍 {worker.distance_km.toFixed(1)} km away
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <Link
            to={`/book/${worker.id}${serviceSlug ? `?service=${serviceSlug}` : ''}`}
            className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5"
          >
            Book Now
          </Link>
          <a
            href={`tel:${worker.phone}`}
            className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5"
          >
            📞 Call
          </a>
        </div>
      </div>
    </div>
  )
}
