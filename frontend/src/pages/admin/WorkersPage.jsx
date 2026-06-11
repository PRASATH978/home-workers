import { useEffect, useState } from 'react'
import adminApi from '../../utils/adminApi'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Search, Eye } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_BADGE = {
  pending:  'badge-orange',
  verified: 'badge-green',
  rejected: 'badge-red',
}

export default function AdminWorkersPage() {
  const [workers, setWorkers]   = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter]     = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [note, setNote]         = useState('')
  const [saving, setSaving]     = useState(false)

  const load = () => {
    setIsLoading(true)
    adminApi.get('/workers/all/')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || []
        setWorkers(data)
      })
      .catch(() => toast.error('Failed to load workers'))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleVerify = async (workerId, status) => {
    setSaving(true)
    try {
      await adminApi.patch(`/workers/${workerId}/verify/`, {
        verification_status: status,
        verification_note: note,
      })
      toast.success(`Worker ${status}`)
      setSelected(null)
      setNote('')
      load()
    } catch {
      toast.error('Failed to update. Make sure you are logged in as admin.')
    }
    setSaving(false)
  }

  const counts = {
    all:      workers.length,
    pending:  workers.filter(w => w.verification_status === 'pending').length,
    verified: workers.filter(w => w.verification_status === 'verified').length,
    rejected: workers.filter(w => w.verification_status === 'rejected').length,
  }

  const filtered = workers.filter(w => {
    const matchFilter = filter === 'all' || w.verification_status === filter
    const matchSearch = !search
      || w.name?.toLowerCase().includes(search.toLowerCase())
      || w.phone?.includes(search)
    return matchFilter && matchSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Workers</h1>
        <p className="text-surface-muted text-sm mt-1">
          {counts.verified} verified · {counts.pending} pending · {counts.rejected} rejected
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-muted" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'verified', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                filter === f
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-surface-border text-slate-400 hover:text-white'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">👷</p>
          <p className="text-white font-semibold">No workers found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  {['Worker', 'Phone', 'Services', 'Jobs', 'Rating', 'Plan', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-surface-muted uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs flex-shrink-0">
                          {w.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{w.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{w.phone}</td>
                    <td className="px-4 py-3 text-xs text-surface-muted max-w-32 truncate">
                      {w.service_names?.join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{w.total_jobs || 0}</td>
                    <td className="px-4 py-3 text-sm text-yellow-400">
                      ⭐ {w.avg_rating?.toFixed(1) || '0.0'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-blue capitalize">{w.subscription_plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`${STATUS_BADGE[w.verification_status] || 'badge-gray'} capitalize`}>
                        {w.verification_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(w); setNote('') }}
                        className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-sm font-medium"
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md p-6 shadow-card">
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 text-2xl font-bold">
                {selected.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">{selected.name}</h3>
                <p className="text-surface-muted text-sm">{selected.phone}</p>
                <span className={`${STATUS_BADGE[selected.verification_status] || 'badge-gray'} capitalize mt-1 inline-block`}>
                  {selected.verification_status}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2 text-sm mb-5">
              {[
                ['Services',    selected.service_names?.join(', ') || '—'],
                ['Experience',  `${selected.experience_years || 0} years`],
                ['Total Jobs',  selected.total_jobs || 0],
                ['Rating',      `${selected.avg_rating?.toFixed(1) || '0.0'} ★ (${selected.rating_count || 0} reviews)`],
                ['Plan',        selected.subscription_plan],
                ['City',        selected.city || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1.5 border-b border-surface-border">
                  <span className="text-surface-muted">{k}</span>
                  <span className="text-white font-medium capitalize">{v}</span>
                </div>
              ))}
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-1.5 block">
                Admin note (shown to worker on rejection)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. ID proof not clear, please re-upload"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="input resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleVerify(selected.id, 'verified')}
                disabled={saving || selected.verification_status === 'verified'}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                <CheckCircle size={16} />
                {saving ? '…' : 'Verify'}
              </button>
              <button
                onClick={() => handleVerify(selected.id, 'rejected')}
                disabled={saving || selected.verification_status === 'rejected'}
                className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 font-semibold py-2.5 rounded-xl border border-red-500/30 transition-colors"
              >
                <XCircle size={16} />
                {saving ? '…' : 'Reject'}
              </button>
              <button
                onClick={() => { setSelected(null); setNote('') }}
                className="px-4 py-2.5 rounded-xl border border-surface-border text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
