import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Linking,
} from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router, useLocalSearchParams } from 'expo-router'
import { fetchNearbyWorkers, fetchServices } from '../../src/store/slices'

function WorkerCard({ worker }) {
  return (
    <View className={`bg-surface-card border rounded-2xl p-4 mb-3 ${worker.is_featured ? 'border-brand-500' : 'border-surface-border'}`}>
      {worker.is_featured && (
        <View className="self-start bg-brand-500/15 border border-brand-500/40 rounded-full px-3 py-1 mb-3">
          <Text className="text-brand-400 text-xs font-semibold">👑 Featured</Text>
        </View>
      )}
      <View className="flex-row gap-3">
        <View className="w-14 h-14 rounded-xl bg-brand-500/15 border border-brand-500/30 items-center justify-center">
          <Text className="text-brand-400 text-xl font-bold">{worker.name?.[0]?.toUpperCase()}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 flex-wrap">
            <Text className="text-white font-bold text-base">{worker.name}</Text>
            <Text className={`text-xs font-semibold ${worker.is_available ? 'text-emerald-400' : 'text-surface-muted'}`}>
              {worker.is_available ? '● Online' : 'Offline'}
            </Text>
          </View>
          <Text className="text-slate-400 text-xs mt-1">
            ⭐ {worker.avg_rating?.toFixed(1) || 'New'} ({worker.rating_count} reviews)
          </Text>
          <Text className="text-surface-muted text-xs mt-1">
            💼 {worker.total_jobs} jobs{worker.city ? ` · 📍 ${worker.city}` : ''}
            {worker.distance_km && worker.distance_km < 999 ? ` · ${worker.distance_km.toFixed(1)} km` : ''}
          </Text>
          <Text className="text-brand-400 text-xs mt-1">{worker.service_names?.join(', ')}</Text>
        </View>
      </View>
      <View className="flex-row gap-2.5 mt-4">
        <TouchableOpacity
          className="flex-1 bg-brand-500 rounded-xl py-2.5 items-center"
          onPress={() => router.push({ pathname: '/customer/book', params: { workerId: worker.id } })}
        >
          <Text className="text-white font-bold text-sm">Book Now</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-surface-card border border-surface-border rounded-xl py-2.5 items-center"
          onPress={() => Linking.openURL(`tel:${worker.phone}`)}
        >
          <Text className="text-white font-semibold text-sm">📞 Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function WorkersScreen() {
  const dispatch = useDispatch()
  const params = useLocalSearchParams()
  const { nearby: workers, isLoading } = useSelector(s => s.workers)
  const { items: services } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)
  const [selectedService, setSelectedService] = useState(params.service || '')
  const [search, setSearch] = useState('')

  useEffect(() => { dispatch(fetchServices()) }, [])
  useEffect(() => {
    dispatch(fetchNearbyWorkers({ service: selectedService || undefined, lat: user?.latitude, lng: user?.longitude }))
  }, [selectedService])

  const filtered = workers.filter(w => !search || w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <View className="flex-1 bg-surface">
      <View className="px-4 pt-14 pb-3">
        <Text className="text-white text-2xl font-extrabold">Find Workers</Text>
        <Text className="text-surface-muted text-sm mt-1">{filtered.length} available near you</Text>
      </View>

      {/* Search */}
      <View className="px-4 mb-2">
        <TextInput
          className="bg-surface-card border border-surface-border rounded-xl px-4 py-3 text-white text-sm"
          placeholder="Search by name…"
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Service filter chips */}
      <FlatList
        horizontal
        data={[{ slug: '', name: 'All' }, ...services]}
        keyExtractor={i => i.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-2 pb-2"
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedService(item.slug)}
            className={`px-4 py-1.5 rounded-full border ${selectedService === item.slug ? 'bg-brand-500 border-brand-500' : 'bg-surface-card border-surface-border'}`}
          >
            <Text className={`text-sm font-medium ${selectedService === item.slug ? 'text-white' : 'text-surface-muted'}`}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <ActivityIndicator color="#f97316" className="mt-10" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={w => String(w.id)}
          renderItem={({ item }) => <WorkerCard worker={item} />}
          contentContainerClassName="px-4 pt-2 pb-6"
          ListEmptyComponent={
            <View className="items-center pt-16">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-white font-semibold text-base">No workers found</Text>
              <Text className="text-surface-muted text-sm mt-1">Try a different service</Text>
            </View>
          }
        />
      )}
    </View>
  )
}
