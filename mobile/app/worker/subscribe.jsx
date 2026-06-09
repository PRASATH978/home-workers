import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'

const PLANS = [
  { key:'basic',    name:'Basic',    price:0,   icon:'🔧', features:['5 leads/month','Basic listing','Reviews'] },
  { key:'pro',      name:'Pro',      price:199, icon:'⚡', features:['Unlimited leads','Priority search','WhatsApp alerts','Reviews'] },
  { key:'featured', name:'Featured', price:499, icon:'👑', features:['Everything in Pro','Top of search','Featured badge','Priority support'], highlight:true },
]

export default function WorkerSubscribeScreen() {
  const { profile } = useSelector(s => s.workers)

  const handleSubscribe = async (plan) => {
    if (plan.key === 'basic') return
    try {
      const { data } = await api.post('/payments/subscription/', { plan: plan.key })
      Toast.show({ type: 'info', text1: 'Payment initiated', text2: `Order: ${data.order_id}`, visibilityTime: 4000 })
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to initiate payment' })
    }
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-4 pt-14 pb-10" showsVerticalScrollIndicator={false}>
      <Text className="text-white text-2xl font-extrabold mb-1">Upgrade Plan</Text>
      <Text className="text-surface-muted text-sm mb-5">More leads = more earnings</Text>

      {profile && (
        <View className="bg-surface-card border border-surface-border rounded-2xl py-3 px-4 items-center mb-5">
          <Text className="text-surface-muted text-sm">
            Current: <Text className="text-brand-400 font-bold">{profile.subscription_plan?.toUpperCase()}</Text>
          </Text>
        </View>
      )}

      {PLANS.map(plan => (
        <View key={plan.key} className={`rounded-2xl p-5 mb-4 border ${plan.highlight ? 'bg-brand-500/5 border-brand-500' : 'bg-surface-card border-surface-border'}`}>
          {plan.highlight && (
            <View className="self-start bg-brand-500/15 border border-brand-500/40 rounded-full px-3 py-1 mb-3">
              <Text className="text-brand-400 text-xs font-semibold">👑 Most Popular</Text>
            </View>
          )}
          <View className="flex-row items-center gap-3 mb-4">
            <Text className="text-3xl">{plan.icon}</Text>
            <View>
              <Text className="text-white text-lg font-extrabold">{plan.name}</Text>
              <Text className="text-brand-400 font-semibold text-sm mt-0.5">
                {plan.price === 0 ? 'Free' : `₹${plan.price}/month`}
              </Text>
            </View>
          </View>

          {plan.features.map(f => (
            <View key={f} className="flex-row gap-2 items-start mb-2">
              <Text className="text-emerald-400 font-bold text-sm">✓</Text>
              <Text className="text-slate-400 text-sm flex-1">{f}</Text>
            </View>
          ))}

          <TouchableOpacity
            className={`rounded-xl py-3.5 items-center mt-4 ${
              plan.highlight ? 'bg-brand-500' :
              profile?.subscription_plan === plan.key || plan.key === 'basic'
                ? 'bg-surface border border-surface-border opacity-50'
                : 'bg-surface-card border border-surface-border'
            }`}
            onPress={() => handleSubscribe(plan)}
            disabled={profile?.subscription_plan === plan.key || plan.key === 'basic'}
          >
            <Text className={`font-bold text-sm ${plan.highlight ? 'text-white' : 'text-white'}`}>
              {profile?.subscription_plan === plan.key ? '✅ Active Plan' :
               plan.key === 'basic' ? 'Free Plan' : `Get ${plan.name}`}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Earnings info */}
      <View className="bg-surface-card border border-surface-border rounded-2xl p-5">
        <Text className="text-white font-bold text-base mb-4">💰 How Earnings Work</Text>
        <View className="flex-row gap-2">
          {[['10%','Platform fee\n(Basic)','text-brand-400'],['₹450','You keep on\n₹500 job','text-emerald-400'],['₹0','Fee on Pro\nplan','text-brand-400']].map(([val, label, color]) => (
            <View key={val} className="flex-1 bg-surface rounded-xl py-3 px-2 items-center">
              <Text className={`${color} text-lg font-extrabold`}>{val}</Text>
              <Text className="text-surface-muted text-xs mt-1 text-center">{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}
