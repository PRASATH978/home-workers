import { useState } from 'react'
import { useSelector } from 'react-redux'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { Crown, Check, Zap } from 'lucide-react'

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: 0,
    period: 'Free forever',
    icon: '🔧',
    color: 'border-surface-border',
    features: ['5 leads per month', 'Basic listing', 'Customer reviews'],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 199,
    period: 'per month',
    icon: '⚡',
    color: 'border-blue-500/50',
    highlight: false,
    features: ['Unlimited leads', 'Priority in search', 'WhatsApp notifications', 'Customer reviews'],
    cta: 'Upgrade to Pro',
  },
  {
    key: 'featured',
    name: 'Featured',
    price: 499,
    period: 'per month',
    icon: '👑',
    color: 'border-brand-500',
    highlight: true,
    features: ['Everything in Pro', 'Top of search results', 'Featured badge', 'Boosted visibility', 'Priority support'],
    cta: 'Get Featured',
  },
]

export default function WorkerSubscribePage() {
  const { profile } = useSelector(s => s.workers)
  const [loading, setLoading] = useState(null)

  const handleSubscribe = async (plan) => {
    if (plan.key === 'basic') return
    setLoading(plan.key)
    try {
      const { data } = await api.post('/payments/subscription/', { plan: plan.key })
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'LocalService Connect',
        description: `${plan.name} Plan – 1 Month`,
        handler: async (response) => {
          try {
            await api.post('/payments/verify/', {
              ...response,
              payment_id: data.payment_id,
            })
            toast.success(`🎉 You're now on the ${plan.name} plan!`)
          } catch {
            toast.error('Payment verification failed')
          }
        },
        theme: { color: '#f97316' },
      })
      rzp.open()
    } catch {
      toast.error('Failed to initiate payment')
    }
    setLoading(null)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-surface-muted mt-2">
          Get more leads, more visibility, more earnings
        </p>
      </div>

      {/* Current plan */}
      {profile && (
        <div className="card text-center py-4 border-brand-500/30">
          <p className="text-surface-muted text-sm">
            Current plan: <span className="text-brand-400 font-semibold uppercase">{profile.subscription_plan}</span>
            {profile.subscription_expires_at && (
              <span className="text-surface-muted ml-2">
                (expires {new Date(profile.subscription_expires_at).toLocaleDateString('en-IN')})
              </span>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <div
            key={plan.key}
            className={`card flex flex-col relative ${plan.color} ${plan.highlight ? 'shadow-glow' : ''}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-orange text-xs px-3 py-1">
                <Crown size={10} /> Most Popular
              </div>
            )}

            <div className="text-center mb-5">
              <span className="text-3xl">{plan.icon}</span>
              <h2 className="font-display text-xl font-bold text-white mt-2">{plan.name}</h2>
              <div className="mt-1">
                {plan.price === 0 ? (
                  <span className="text-2xl font-bold text-white">Free</span>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-surface-muted text-sm ml-1">/{plan.period.split(' ')[1]}</span>
                  </>
                )}
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={plan.disabled || profile?.subscription_plan === plan.key || loading === plan.key}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                plan.highlight
                  ? 'btn-primary'
                  : plan.disabled || profile?.subscription_plan === plan.key
                  ? 'bg-surface border border-surface-border text-surface-muted cursor-not-allowed'
                  : 'btn-secondary'
              }`}
            >
              {loading === plan.key ? 'Processing…' :
               profile?.subscription_plan === plan.key ? '✅ Active Plan' :
               plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Commission info */}
      <div className="card border-surface-border">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Zap size={16} className="text-brand-400" /> How Earnings Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-surface rounded-xl">
            <p className="text-2xl font-bold text-brand-400">10%</p>
            <p className="text-surface-muted mt-1">Platform commission</p>
          </div>
          <div className="text-center p-3 bg-surface rounded-xl">
            <p className="text-2xl font-bold text-emerald-400">₹450</p>
            <p className="text-surface-muted mt-1">You keep on ₹500 job</p>
          </div>
          <div className="text-center p-3 bg-surface rounded-xl">
            <p className="text-2xl font-bold text-white">₹0</p>
            <p className="text-surface-muted mt-1">Commission on Pro plan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
