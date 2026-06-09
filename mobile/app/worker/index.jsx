import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { fetchWorkerProfile, toggleAvailability, fetchWorkerJobs } from '../../src/store/slices'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'

export default function WorkerDashboardScreen() {
  const dispatch = useDispatch()
  const { profile } = useSelector(s => s.workers)
  const { availableJobs } = useSelector(s => s.bookings)
  const user = useSelector(s => s.auth.user)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => Promise.all([dispatch(fetchWorkerProfile()), dispatch(fetchWorkerJobs('available'))])
  useEffect(() => { load() }, [])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const handleToggle = async () => {
    try {
      await api.post('/workers/profile/toggle-availability/')
      dispatch(toggleAvailability())
      Toast.show({ type: 'success', text1: profile?.is_available ? 'You are now offline' : 'You are now online!' })
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update status' })
    }
  }

  const stats = [
    { icon:'💼', label:'Total Jobs', value: profile?.total_jobs ?? 0 },
    { icon:'⭐', label:'Rating',     value: `${profile?.avg_rating ?? 0} ★` },
    { icon:'💬', label:'Reviews',    value: profile?.rating_count ?? 0 },
    { icon:'👑', label:'Plan',       value: (profile?.subscription_plan ?? 'basic').toUpperCase() },
  ]

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerClassName="px-4 pt-14 pb-8"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View>
          <Text className="text-white text-2xl font-extrabold">Hi, {user?.name?.split(' ')[0]} 👋</Text>
          <Text className={`text-sm mt-1 ${profile?.verification_status === 'verified' ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {profile?.verification_status === 'verified' ? '✅ Verified Worker' : `⚠️ ${profile?.verification_status || 'pending'}`}
          </Text>
        </View>
        <TouchableOpacity
          className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border ${profile?.is_available ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-surface-card border-surface-border'}`}
          onPress={handleToggle}
        >
          <Text className={`font-semibold text-sm ${profile?.is_available ? 'text-emerald-400' : 'text-surface-muted'}`}>
            {profile?.is_available ? '🟢 Online' : '⚫ Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Verification alert */}
      {profile?.verification_status !== 'verified' && (
        <TouchableOpacity
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-4"
          onPress={() => router.push('/worker/profile')}
        >
          <Text className="text-yellow-400 text-sm">
            ⚠️ {profile?.verification_status === 'rejected'
              ? 'Verification rejected. Tap to update your ID.'
              : 'Verification pending. Complete your profile →'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Stats grid */}
      <View className="flex-row flex-wrap gap-2.5 mb-6">
        {stats.map(s => (
          <View key={s.label} className="bg-surface-card border border-surface-border rounded-2xl p-4 items-center" style={{ width: '47%' }}>
            <Text className="text-xl mb-1">{s.icon}</Text>
            <Text className="text-white text-xl font-extrabold">{s.value}</Text>
            <Text className="text-surface-muted text-xs mt-0.5">{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Available jobs */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white text-lg font-bold">
          Available Jobs <Text className="text-brand-400">({availableJobs.length})</Text>
        </Text>
        <TouchableOpacity onPress={() => router.push('/worker/jobs')}>
          <Text className="text-brand-400 text-sm">See all ›</Text>
        </TouchableOpacity>
      </View>

      {availableJobs.length === 0 ? (
        <View className="bg-surface-card border border-surface-border rounded-2xl p-7 items-center">
          <Text className="text-4xl mb-2">📭</Text>
          <Text className="text-white font-semibold text-sm">No jobs right now</Text>
          <Text className="text-surface-muted text-xs mt-1">Stay online to receive notifications</Text>
        </View>
      ) : (
        availableJobs.slice(0, 3).map(job => (
          <TouchableOpacity
            key={job.id}
            className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-2.5 flex-row items-center gap-3"
            onPress={() => router.push('/worker/jobs')}
          >
            <View className="flex-1">
              <Text className="text-white font-bold text-sm">{job.service?.name}</Text>
              <Text className="text-surface-muted text-xs mt-0.5" numberOfLines={1}>{job.problem_description}</Text>
              <Text className="text-surface-muted text-xs mt-0.5" numberOfLines={1}>📍 {job.address}</Text>
            </View>
            <Text className="text-surface-muted text-lg">›</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Upgrade CTA */}
      {profile?.subscription_plan === 'basic' && (
        <TouchableOpacity
          className="bg-brand-500/10 border border-brand-500/30 rounded-2xl p-5 items-center mt-4"
          onPress={() => router.push('/worker/subscribe')}
        >
          <Text className="text-brand-400 font-bold text-base">👑 Upgrade to Pro – ₹199/month</Text>
          <Text className="text-surface-muted text-xs mt-1">Unlimited leads · No commission</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}
