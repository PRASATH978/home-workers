import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkerProfile } from '../../store/slices/workersSlice'
import { fetchServices } from '../../store/slices/servicesSlice'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Save, Upload } from 'lucide-react'

export default function WorkerProfilePage() {
  const dispatch = useDispatch()
  const { profile } = useSelector(s => s.workers)
  const { items: services } = useSelector(s => s.services)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    bio: '', experience_years: 0,
    id_proof_type: '', service_radius_km: 10,
    available_from: '', available_to: '',
    service_ids: [],
  })
  const [idFile, setIdFile] = useState(null)

  useEffect(() => {
    dispatch(fetchWorkerProfile())
    dispatch(fetchServices())
  }, [])

  useEffect(() => {
    if (profile) {
      setForm({
        bio: profile.bio || '',
        experience_years: profile.experience_years || 0,
        id_proof_type: profile.id_proof_type || '',
        service_radius_km: profile.service_radius_km || 10,
        available_from: profile.available_from || '',
        available_to: profile.available_to || '',
        service_ids: profile.services?.map(s => s.id) || [],
      })
    }
  }, [profile])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(i => formData.append(k, i))
        else if (v !== '') formData.append(k, v)
      })
      if (idFile) formData.append('id_proof_image', idFile)

      await api.patch('/workers/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Profile updated!')
      dispatch(fetchWorkerProfile())
    } catch {
      toast.error('Failed to save profile')
    }
    setIsSaving(false)
  }

  const toggleService = (id) => {
    setForm(f => ({
      ...f,
      service_ids: f.service_ids.includes(id)
        ? f.service_ids.filter(s => s !== id)
        : [...f.service_ids, id],
    }))
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">My Profile</h1>
        <p className="text-surface-muted text-sm mt-1">
          Verification status:
          <span className={`ml-2 font-medium ${
            profile?.verification_status === 'verified' ? 'text-emerald-400' :
            profile?.verification_status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {profile?.verification_status || 'pending'}
          </span>
        </p>
      </div>

      {/* Services */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Services You Offer</h2>
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleService(s.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                form.service_ids.includes(s.id)
                  ? 'bg-brand-500/20 border-brand-500 text-brand-400'
                  : 'border-surface-border text-surface-muted hover:border-slate-500'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bio & Experience */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">About You</h2>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Bio</label>
          <textarea
            rows={3}
            placeholder="I'm a certified electrician with 5+ years experience in residential wiring…"
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            className="input resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Years of Experience</label>
          <input
            type="number" min={0} max={50}
            value={form.experience_years}
            onChange={e => setForm({ ...form, experience_years: parseInt(e.target.value) })}
            className="input"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Service Radius (km)</label>
          <input
            type="number" min={1} max={100}
            value={form.service_radius_km}
            onChange={e => setForm({ ...form, service_radius_km: parseInt(e.target.value) })}
            className="input"
          />
        </div>
      </div>

      {/* Availability */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Working Hours</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">From</label>
            <input type="time" value={form.available_from}
              onChange={e => setForm({ ...form, available_from: e.target.value })}
              className="input" />
          </div>
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">To</label>
            <input type="time" value={form.available_to}
              onChange={e => setForm({ ...form, available_to: e.target.value })}
              className="input" />
          </div>
        </div>
      </div>

      {/* ID Proof */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">ID Verification</h2>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">ID Type</label>
          <select value={form.id_proof_type}
            onChange={e => setForm({ ...form, id_proof_type: e.target.value })}
            className="input">
            <option value="">Select ID type…</option>
            <option value="aadhaar">Aadhaar Card</option>
            <option value="pan">PAN Card</option>
            <option value="voter">Voter ID</option>
            <option value="licence">Driving Licence</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-400 mb-1.5 block">Upload ID Photo</label>
          <label className="flex items-center gap-3 cursor-pointer p-4 border border-dashed border-surface-border rounded-xl hover:border-brand-500/50 transition-colors">
            <Upload size={18} className="text-surface-muted" />
            <span className="text-surface-muted text-sm">
              {idFile ? idFile.name : (profile?.id_proof_image ? 'ID uploaded ✅' : 'Click to upload')}
            </span>
            <input type="file" accept="image/*" className="hidden"
              onChange={e => setIdFile(e.target.files[0])} />
          </label>
        </div>
      </div>

      <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full flex items-center justify-center gap-2">
        <Save size={16} />
        {isSaving ? 'Saving…' : 'Save Profile'}
      </button>
    </div>
  )
}
