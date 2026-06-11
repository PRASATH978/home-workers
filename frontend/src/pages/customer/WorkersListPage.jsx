import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNearbyWorkers } from '../../store/slices/workersSlice'
import { fetchServices } from '../../store/slices/servicesSlice'
import WorkerCard from '../../components/customer/WorkerCard'
import { Search, Filter, RefreshCw } from 'lucide-react'

export default function WorkersListPage() {
  const dispatch = useDispatch()
  const { nearby: workers, isLoading } = useSelector(s => s.workers)
  const { items: services } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)
  const [selectedService, setSelectedService] = useState('')
  const [search, setSearch] = useState('')

  const loadWorkers = (service = selectedService) => {
    dispatch(fetchNearbyWorkers({
      service: service || undefined,
      lat: user?.latitude,
      lng: user?.longitude,
    }))
  }

  // Always fetch fresh on mount
  useEffect(() => {
    dispatch(fetchServices())
    loadWorkers()
  }, [])

  // Re-fetch when service filter changes
  useEffect(() => {
    loadWorkers(selectedService)
  }, [selectedService])

  const filtered = workers.filter(w =>
    !search || w.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Find Workers</h1>
          <p className="text-surface-muted text-sm mt-1">
            {filtered.length} verified professionals
          </p>
        </div>
        <button
          onClick={() => loadWorkers()}
          className="btn-secondary py-2.5 px-3"
          title="Refresh"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            className="input pl-10 pr-8 appearance-none cursor-pointer sm:w-52"
          >
            <option value="">All Services</option>
            {services.map(s => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-white font-semibold">No workers found</p>
          <p className="text-surface-muted text-sm mt-1">Try a different service or expand your area</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(worker => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      )}
    </div>
  )
}
