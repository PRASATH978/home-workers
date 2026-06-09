import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Linking, RefreshControl,
} from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkerJobs, workerJobAction } from '../../src/store/slices'
import { format } from 'date-fns'
import Toast from 'react-native-toast-message'

const BADGE = {
  pending:     'bg-brand-500/15 text-brand-400',
  accepted:    'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  completed:   'bg-emerald-500/15 text-emerald-400',
}

function JobCard({ job, onAction }) {
  const [otp, setOtp] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(null)

  const act = async (action) => {
    setLoading(action)
    await onAction(job.id, action, { otp, final_price: price ? parseInt(price) : undefined })
    setLoading(null)
  }

  const badgeClass = BADGE[job.status] || 'bg-slate-500/15 text-slate-400'
  const [badgeBg, badgeText] = badgeClass.split(' ')

  return (
    <View className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-3">
      <View className="flex-row gap-3 mb-3">
        <View className="flex-1">
          <Text className="text-white font-bold text-base">{job.service?.name}</Text>
          <Text className="text-surface-muted text-sm mt-0.5" numberOfLines={2}>{job.problem_description}</Text>
        </View>
        <View className={`${badgeBg} rounded-full px-3 py-1 self-start`}>
          <Text className={`${badgeText} text-xs font-semibold capitalize`}>{job.status.replace('_',' ')}</Text>
        </View>
      </View>

      <Text className="text-surface-muted text-xs mb-1">📍 {job.address}</Text>
      <Text className="text-surface-muted text-xs mb-2">📅 {format(new Date(job.created_at), 'dd MMM, hh:mm a')}</Text>

      {job.customer?.phone && (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${job.customer.phone}`)}>
          <Text className="text-brand-400 text-sm mb-2">📞 Call: {job.customer.phone}</Text>
        </TouchableOpacity>
      )}
      {job.final_price && <Text className="text-emerald-400 font-bold text-sm mb-2">💰 ₹{job.final_price}</Text>}

      {/* Actions */}
      {job.status === 'pending' && (
        <TouchableOpacity
          className={`bg-brand-500 rounded-xl py-3 items-center mt-1 ${loading === 'accept' ? 'opacity-60' : ''}`}
          onPress={() => act('accept')} disabled={loading === 'accept'}
        >
          <Text className="text-white font-bold text-sm">{loading === 'accept' ? '…' : '✅ Accept Job'}</Text>
        </TouchableOpacity>
      )}
      {job.status === 'accepted' && (
        <TouchableOpacity
          className={`bg-brand-500 rounded-xl py-3 items-center mt-1 ${loading === 'start' ? 'opacity-60' : ''}`}
          onPress={() => act('start')} disabled={loading === 'start'}
        >
          <Text className="text-white font-bold text-sm">{loading === 'start' ? '…' : '▶️ Start Job'}</Text>
        </TouchableOpacity>
      )}
      {job.status === 'in_progress' && (
        <View className="gap-2 mt-1">
          <TextInput
            className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm text-center tracking-widest"
            placeholder="Customer OTP"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />
          <TextInput
            className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm"
            placeholder="Final price ₹"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            value={price}
            onChangeText={setPrice}
          />
          <TouchableOpacity
            className={`bg-emerald-500 rounded-xl py-3 items-center ${loading === 'complete' ? 'opacity-60' : ''}`}
            onPress={() => act('complete')} disabled={loading === 'complete'}
          >
            <Text className="text-white font-bold text-sm">{loading === 'complete' ? '…' : '✔️ Mark Complete'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {job.status === 'completed' && (
        <Text className="text-emerald-400 font-semibold text-sm mt-1">✔️ Job completed</Text>
      )}
    </View>
  )
}

export default function WorkerJobsScreen() {
  const dispatch = useDispatch()
  const { availableJobs, myJobs, isLoading } = useSelector(s => s.bookings)
  const [tab, setTab] = useState('available')
  const [refreshing, setRefreshing] = useState(false)

  const load = () => dispatch(fetchWorkerJobs(tab))
  useEffect(() => { load() }, [tab])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const handleAction = async (bookingId, action, extra) => {
    const res = await dispatch(workerJobAction({ bookingId, action, ...extra }))
    if (res.meta.requestStatus === 'fulfilled') {
      Toast.show({ type: 'success', text1: `Job ${action}ed!` })
      load()
    } else {
      Toast.show({ type: 'error', text1: res.payload?.error || `Failed to ${action}` })
    }
  }

  const jobs = tab === 'available' ? availableJobs : myJobs

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-14 pb-3">
        <Text className="text-white text-2xl font-extrabold">Jobs</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row mx-4 mb-3 bg-surface-card border border-surface-border rounded-xl p-1 gap-1">
        {[['available','Available'], ['mine','My Jobs']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 py-2.5 rounded-lg items-center ${tab === key ? 'bg-brand-500' : ''}`}
            onPress={() => setTab(key)}
          >
            <Text className={`font-semibold text-sm ${tab === key ? 'text-white' : 'text-surface-muted'}`}>
              {label} ({key === 'available' ? availableJobs.length : myJobs.length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !refreshing ? (
        <ActivityIndicator color="#f97316" className="mt-10" />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={j => String(j.id)}
          renderItem={({ item }) => <JobCard job={item} onAction={handleAction} />}
          contentContainerClassName="px-4 pt-1 pb-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-4xl mb-3">📭</Text>
              <Text className="text-white font-semibold text-base">{tab === 'available' ? 'No available jobs' : 'No active jobs'}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
