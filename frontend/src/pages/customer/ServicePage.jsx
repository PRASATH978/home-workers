import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNearbyWorkers } from '../../store/slices/workersSlice'
import WorkerCard from '../../components/customer/WorkerCard'
import { ArrowLeft, MapPin } from 'lucide-react'

export default function ServicePage() {
  const { slug } = useParams()
  const dispatch = useDispatch()
  const { nearby: workers, isLoading } = useSelector(s => s.workers)
  const user = useSelector(s => s.auth.user)

  useEffect(() => {
    dispatch(fetchNearbyWorkers({
      service: slug,
      lat: user?.latitude,
      lng: user?.longitude,
    }))
  }, [slug])

  const serviceName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/" className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{serviceName}</h1>
          <p className="text-surface-muted text-sm flex items-center gap-1 mt-0.5">
            <MapPin size={13} /> {user?.city || 'Nearby'} · {workers.length} workers available
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">😔</p>
          <p className="text-white font-semibold">No workers found nearby</p>
          <p className="text-surface-muted text-sm mt-1">Try increasing the search radius or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workers.map(worker => (
            <WorkerCard key={worker.id} worker={worker} serviceSlug={slug} />
          ))}
        </div>
      )}
    </div>
  )
}
