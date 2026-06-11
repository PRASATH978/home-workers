import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { createBooking, fetchMyBookings } from '../../store/slices/bookingsSlice'
import { fetchServices } from '../../store/slices/servicesSlice'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { ArrowLeft, MapPin, Calendar, FileText } from 'lucide-react'

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
    dispatch(fetchServices())
    if (workerId) {
      api.get(`/workers/${workerId}/`).then(res => setWorker(res.data)).catch(() => {})
    }
  }, [workerId])

  useEffect(() => {
    if (!services.length) return

    if (serviceSlug) {
      const svc = services.find(s => s.slug === serviceSlug)
      if (svc) { setForm(f => ({ ...f, service: String(svc.id) })); return }
    }
    if (worker?.services?.length === 1) {
      setForm(f => ({ ...f, service: String(worker.services[0].id) })); return
    }
    if (worker?.services?.length > 0 && !form.service) {
      setForm(f => ({ ...f, service: String(worker.services[0].id) }))
    }
  }, [serviceSlug, services, worker])

  const availableServices = worker?.services?.length
    ? services.filter(s => worker.services.some(ws => ws.id === s.id || ws.slug === s.slug))
    : services

  const workerName = worker?.user?.name || worker?.name
  const workerServiceNames = worker?.services?.map(s => s.name).join(', ')
    || worker?.service_names?.join(', ')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.service)                    return toast.error('Please select a service')
    if (!form.problem_description.trim()) return toast.error('Please describe your problem')
    if (!form.address.trim())             return toast.error('Please enter your address')

    setIsSubmitting(true)

    const payload = {
      service: form.service,
      problem_description: form.problem_description,
      address: form.address,
      ...(form.scheduled_at ? { scheduled_at: form.scheduled_at } : {}),
    }

    const res = await dispatch(createBooking(payload))
    setIsSubmitting(false)

    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Booking created! Workers will be notified.')
      // ✅ Fetch fresh bookings BEFORE navigating so list is ready
      await dispatch(fetchMyBookings())
      navigate('/bookings')
    } else {
      const err = res.payload
      const msg = err?.service?.[0] || err?.non_field_errors?.[0] || err?.detail || 'Failed to create booking.'
      toast.error(msg)
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

      {workerName && (
        <div className="card flex items-center gap-4 py-4 border-brand-500/30">
          <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-lg flex-shrink-0">
            {workerName[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{workerName}</p>
            {workerServiceNames && (
              <p className="text-sm text-surface-muted">{workerServiceNames}</p>
            )}
          </div>
          <span className="ml-auto badge-green text-xs">Selected</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">
            Service Type <span className="text-red-400">*</span>
          </label>
          <select
            value={form.service}
            onChange={e => setForm({ ...form, service: e.target.value })}
            className="input"
            required
          >
            <option value="">Select a service…</option>
            {availableServices.map(s => (
              <option key={s.id} value={String(s.id)}>
                {s.name} — from ₹{s.base_price}
              </option>
            ))}
          </select>
          {worker && availableServices.length === 0 && (
            <p className="text-xs text-yellow-400 mt-1">
              This worker hasn't set up their services yet
            </p>
          )}
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
            <FileText size={13} />
            Problem Description <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            placeholder={"Describe your problem in detail…\ne.g. Bathroom tap is leaking, water dripping continuously"}
            value={form.problem_description}
            onChange={e => setForm({ ...form, problem_description: e.target.value })}
            className="input resize-none"
            required
          />
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
            <MapPin size={13} />
            Service Address <span className="text-red-400">*</span>
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

        <div>
          <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Calendar size={13} />
            Preferred Date & Time
            <span className="text-surface-muted text-xs">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={form.scheduled_at}
            onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
            className="input"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full text-base"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating booking…
            </span>
          ) : '✅ Confirm Booking'}
        </button>
      </form>
    </div>
  )
}
