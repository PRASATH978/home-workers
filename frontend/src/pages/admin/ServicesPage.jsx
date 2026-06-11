import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import adminApi from '../../utils/adminApi'
import toast from 'react-hot-toast'

const ICONS  = ['wrench','bolt','hammer','paint','snowflake','droplet','broom','car','brick','fire','leaf']
const EMOJI  = { wrench:'🔧',bolt:'⚡',hammer:'🔨',paint:'🎨',snowflake:'❄️',droplet:'💧',broom:'🧹',car:'🚗',brick:'🧱',fire:'🔥',leaf:'🌿' }
const EMPTY  = { name:'', slug:'', icon:'wrench', description:'', base_price:'', sort_order:'0' }

export default function AdminServicesPage() {
  const [services, setServices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [modal,  setModal]  = useState(null)
  const [form,   setForm]   = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    adminApi.get('/services/').then(res => {
      setServices(res.data.results || res.data || [])
      setIsLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (s) => {
    setForm({ ...s, base_price: String(s.base_price), sort_order: String(s.sort_order) })
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.name || !form.slug) return toast.error('Name and slug are required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        base_price: parseInt(form.base_price) || 0,
        sort_order: parseInt(form.sort_order) || 0,
      }
      if (modal === 'add') await adminApi.post('/services/', payload)
      else await adminApi.patch(`/services/${form.slug}/`, payload)
      toast.success(modal === 'add' ? 'Service added!' : 'Service updated!')
      setModal(null)
      load()
    } catch {
      toast.error('Failed to save service')
    }
    setSaving(false)
  }

  const handleDelete = async (slug) => {
    if (!window.confirm('Delete this service?')) return
    try {
      await adminApi.delete(`/services/${slug}/`)
      toast.success('Service deleted')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Services</h1>
          <p className="text-surface-muted text-sm mt-1">{services.length} service categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.slug} className="card flex items-center gap-4">
              <span className="text-3xl flex-shrink-0">{EMOJI[s.icon] || '🔧'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white">{s.name}</p>
                <p className="text-xs text-surface-muted mt-0.5 truncate">{s.description || 'No description'}</p>
                <p className="text-xs text-brand-400 mt-1">from ₹{s.base_price}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(s)} className="text-slate-400 hover:text-brand-400 transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(s.slug)} className="text-slate-400 hover:text-red-400 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white text-lg">
                {modal === 'add' ? 'Add Service' : 'Edit Service'}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Name *</label>
                <input value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input" placeholder="Plumber" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Slug * (URL-friendly)</label>
                <input value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="input font-mono" placeholder="plumber" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(i => (
                    <button key={i} onClick={() => setForm({ ...form, icon: i })}
                      className={`text-xl p-2 rounded-lg border transition-all ${
                        form.icon === i
                          ? 'border-brand-500 bg-brand-500/15'
                          : 'border-surface-border hover:border-slate-500'
                      }`}>
                      {EMOJI[i]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Base Price (₹)</label>
                  <input type="number" value={form.base_price}
                    onChange={e => setForm({ ...form, base_price: e.target.value })}
                    className="input" placeholder="300" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Sort Order</label>
                  <input type="number" value={form.sort_order}
                    onChange={e => setForm({ ...form, sort_order: e.target.value })}
                    className="input" placeholder="1" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Description</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="input resize-none" placeholder="Brief description…" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Save size={15} /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setModal(null)} className="btn-secondary px-4">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
