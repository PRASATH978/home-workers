import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchServices } from '../../store/slices/servicesSlice'
import { MapPin, Star, Search, ChevronRight } from 'lucide-react'

const SERVICE_ICONS = {
  wrench: '🔧', bolt: '⚡', hammer: '🔨', paint: '🎨',
  snowflake: '❄️', droplet: '💧', broom: '🧹',
  car: '🚗', brick: '🧱', fire: '🔥', leaf: '🌿',
}

const STATS = [
  { label: 'Verified Workers', value: '500+' },
  { label: 'Services Done', value: '12,000+' },
  { label: 'Cities Covered', value: '8' },
]

export default function CustomerHome() {
  const dispatch = useDispatch()
  const { items: services, isLoading } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)

  useEffect(() => {
    if (!services.length) dispatch(fetchServices())
  }, [])

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-orange-400 p-8 md:p-12">
        <div className="relative z-10">
          <p className="text-brand-100 text-sm font-medium mb-2">
            📍 {user?.city || 'Tamil Nadu'}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
            Home services,<br />at your doorstep
          </h1>
          <p className="text-brand-100 mb-6 max-w-sm">
            Book verified plumbers, electricians, and 9 more professionals near you in minutes.
          </p>
          <Link to="/workers" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors">
            <Search size={16} /> Find Workers <ChevronRight size={16} />
          </Link>
        </div>
        {/* BG decoration */}
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="absolute top-4 right-4 text-9xl">🔧</div>
          <div className="absolute bottom-4 right-16 text-7xl">⚡</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="card text-center py-4">
            <div className="font-display text-2xl font-bold text-brand-400">{s.value}</div>
            <div className="text-xs text-surface-muted mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-white">Services</h2>
          <Link to="/workers" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
            View all <ChevronRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-surface-card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {services.map(service => (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                className="card group flex flex-col items-center text-center py-5 gap-3 hover:border-brand-500/50 hover:shadow-glow transition-all"
              >
                <span className="text-3xl">{SERVICE_ICONS[service.icon] || '🔧'}</span>
                <div>
                  <p className="font-semibold text-sm text-white group-hover:text-brand-400 transition-colors">
                    {service.name}
                  </p>
                  <p className="text-xs text-surface-muted mt-0.5">from ₹{service.base_price}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="card">
        <h2 className="font-display text-xl font-bold text-white mb-6">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { emoji: '📱', step: '1', title: 'Select Service', desc: 'Choose what you need from 11 categories' },
            { emoji: '👷', step: '2', title: 'See Workers', desc: 'View verified pros near your location' },
            { emoji: '📅', step: '3', title: 'Book', desc: 'Describe your problem and confirm booking' },
            { emoji: '⭐', step: '4', title: 'Rate', desc: 'Job done — rate your experience' },
          ].map(item => (
            <div key={item.step} className="flex flex-col items-center text-center gap-2">
              <div className="relative">
                <span className="text-3xl">{item.emoji}</span>
                <span className="absolute -top-1 -right-2 w-5 h-5 bg-brand-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {item.step}
                </span>
              </div>
              <p className="font-semibold text-white text-sm">{item.title}</p>
              <p className="text-xs text-surface-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
