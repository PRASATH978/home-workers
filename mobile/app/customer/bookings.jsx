import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { fetchMyBookings } from '../../src/store/slices'
import { format } from 'date-fns'

const STATUS_STYLE = {
  pending:     { bg: 'bg-brand-500/15',    text: 'text-brand-400' },
  accepted:    { bg: 'bg-blue-500/15',     text: 'text-blue-400' },
  in_progress: { bg: 'bg-blue-500/15',     text: 'text-blue-400' },
  completed:   { bg: 'bg-emerald-500/15',  text: 'text-emerald-400' },
  cancelled:   { bg: 'bg-red-500/15',      text: 'text-red-400' },
  rejected:    { bg: 'bg-red-500/15',      text: 'text-red-400' },
}
const STATUS_LABEL = {
  pending:'⏳ Pending', accepted:'✅ Accepted', in_progress:'🔧 In Progress',
  completed:'✔️ Completed', cancelled:'❌ Cancelled', rejected:'❌ Rejected',
}

function BookingItem({ item }) {
  const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending
  return (
    <TouchableOpacity
      className="bg-surface-card border border-surface-border rounded-2xl p-4 mb-2.5"
      onPress={() => router.push({ pathname: '/customer/booking-detail', params: { id: item.id } })}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-3 mb-2.5">
        <View className="flex-1">
          <Text className="text-white font-bold text-base">{item.service?.name}</Text>
          <Text className="text-surface-muted text-sm mt-0.5" numberOfLines={1}>{item.problem_description}</Text>
        </View>
        <View className={`${s.bg} rounded-full px-3 py-1`}>
          <Text className={`${s.text} text-xs font-semibold`}>{STATUS_LABEL[item.status]}</Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center">
        <Text className="text-surface-muted text-xs">📅 {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}</Text>
        {item.final_price && <Text className="text-emerald-400 font-bold text-sm">₹{item.final_price}</Text>}
      </View>
    </TouchableOpacity>
  )
}

export default function BookingsScreen() {
  const dispatch = useDispatch()
  const { myBookings, isLoading } = useSelector(s => s.bookings)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => dispatch(fetchMyBookings())
  useEffect(() => { load() }, [])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-14 pb-3">
        <Text className="text-white text-2xl font-extrabold">My Bookings</Text>
        <Text className="text-surface-muted text-sm mt-1">{myBookings.length} total</Text>
      </View>

      {isLoading && !refreshing ? (
        <ActivityIndicator color="#f97316" className="mt-10" />
      ) : (
        <FlatList
          data={myBookings}
          keyExtractor={b => String(b.id)}
          renderItem={({ item }) => <BookingItem item={item} />}
          contentContainerClassName="px-4 pt-1 pb-6"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
          ListEmptyComponent={
            <View className="items-center pt-20">
              <Text className="text-5xl mb-3">📋</Text>
              <Text className="text-white font-semibold text-base">No bookings yet</Text>
              <TouchableOpacity onPress={() => router.push('/customer')} className="bg-brand-500 rounded-xl px-6 py-3 mt-4">
                <Text className="text-white font-bold">Browse Services</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}
