import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createBooking } from '../../store/slices/bookingsSlice'
import { fetchServices } from '../../store/slices/servicesSlice'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Calendar, FileText, Camera } from 'lucide-react'

export default function BookingFormPage() {
  const { workerId } = useParams()
  const [searchParams] = useSearchParams()
  const serviceSlug = searchParams.get('service')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items: services } = useSelector(s => s.services)
  const [worker, setWorker] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    service: '',
    problem_description: '',
    address: '',
    scheduled_at: '',
  })

  useEffect(() => {
    if (!services.length) dispatch(fetchServices())
    // Load worker
    api.get(`/workers/${workerId}/`).then(res => setWorker(res.data))
  }, [workerId])

  useEffect(() => {
    if (serviceSlug && services.length) {
      const svc = services.find(s => s.slug === serviceSlug)
      if (svc) setForm(f => ({ ...f, service: svc.id }))
    }
  }, [serviceSlug, services])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.service) return toast.error('Please select a service')
    if (!form.problem_description.trim()) return toast.error('Please describe your problem')
    if (!form.address.trim()) return toast.error('Please enter your address')

    setIsSubmitting(true)
    const payload = {
      ...form,
      scheduled_at: form.scheduled_at || undefined,
    }
    const res = await dispatch(createBooking(payload))
    setIsSubmitting(false)

    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Booking created! Workers will be notified.')
      navigate('/bookings')
    } else {
      toast.error('Failed to create booking. Try again.')
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary py-2 px-3">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display text-2xl font-bold text-white">Book Service</h1>
      </div>

      {/* Worker preview */}
      {worker && (
        <div className="card flex items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-lg">
            {worker.user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{worker.user?.name}</p>
            <p className="text-sm text-surface-muted">{worker.service_names?.join(', ')}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        {/* Service */}
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Service Type *</label>
          <select
            value={form.service}
            onChange={e => setForm({ ...form, service: e.target.value })}
            className="input"
            required
          >
            <option value="">Select a service…</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name} – from ₹{s.base_price}</option>
            ))}
          </select>
        </div>

        {/* Problem */}
        <div>
          <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText size={13} /> Problem Description *
          </label>
          <textarea
            rows={4}
            placeholder="Describe your problem in detail… e.g. Bathroom tap is leaking, water dripping continuously"
            value={form.problem_description}
            onChange={e => setForm({ ...form, problem_description: e.target.value })}
            className="input resize-none"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
            <MapPin size={13} /> Service Address *
          </label>
          <textarea
            rows={2}
            placeholder="No. 12, Gandhi Nagar, Krishnagiri – 635001"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="input resize-none"
            required
          />
        </div>

        {/* Preferred Date */}
        <div>
          <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar size={13} /> Preferred Date & Time (optional)
          </label>
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
            className="input"
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? 'Submitting…' : '✅ Confirm Booking'}
        </button>
      </form>
    </div>
  )
}
