import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { fetchServices } from '../../src/store/slices'
import * as Location from 'expo-location'
import api from '../../src/utils/api'

const SERVICE_ICONS = {
  wrench:'🔧', bolt:'⚡', hammer:'🔨', paint:'🎨',
  snowflake:'❄️', droplet:'💧', broom:'🧹',
  car:'🚗', brick:'🧱', fire:'🔥', leaf:'🌿',
}

const STEPS = [
  { icon:'📱', n:'1', title:'Select Service', desc:'Choose from 11 categories' },
  { icon:'👷', n:'2', title:'See Workers',    desc:'Verified pros near you' },
  { icon:'📅', n:'3', title:'Book',           desc:'Describe your problem' },
  { icon:'⭐', n:'4', title:'Rate',           desc:'After job is done' },
]

export default function CustomerHomeScreen() {
  const dispatch = useDispatch()
  const { items: services, isLoading } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)

  useEffect(() => {
    dispatch(fetchServices())
    requestLocation()
  }, [])

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return
    const loc = await Location.getCurrentPositionAsync({})
    api.post('/auth/location/', {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    }).catch(() => {})
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="p-4 pb-8" showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View className="bg-brand-500 rounded-3xl p-6 mb-4">
        <Text className="text-orange-100 text-xs font-medium mb-1.5">📍 {user?.city || 'Tamil Nadu'}</Text>
        <Text className="text-white text-3xl font-extrabold leading-tight mb-2">
          Home services,{'\n'}at your doorstep
        </Text>
        <Text className="text-orange-100 text-sm mb-5">Book verified professionals near you in minutes</Text>
        <TouchableOpacity
          className="bg-white rounded-xl px-5 py-3 self-start"
          onPress={() => router.push('/customer/workers')}
        >
          <Text className="text-brand-600 font-bold text-sm">🔍 Find Workers</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View className="flex-row gap-2.5 mb-5">
        {[['500+','Verified Workers'],['12K+','Jobs Done'],['8','Cities']].map(([val, label]) => (
          <View key={label} className="flex-1 bg-surface-card border border-surface-border rounded-2xl py-3 items-center">
            <Text className="text-brand-400 text-lg font-extrabold">{val}</Text>
            <Text className="text-surface-muted text-xs mt-0.5 text-center">{label}</Text>
          </View>
        ))}
      </View>

      {/* Services */}
      <Text className="text-white text-lg font-bold mb-3">Services</Text>
      {isLoading ? (
        <ActivityIndicator color="#f97316" className="mt-6" />
      ) : (
        <View className="flex-row flex-wrap gap-2.5">
          {services.map(svc => (
            <TouchableOpacity
              key={svc.slug}
              className="bg-surface-card border border-surface-border rounded-2xl p-4 items-center gap-1.5"
              style={{ width: '47%' }}
              onPress={() => router.push({ pathname: '/customer/workers', params: { service: svc.slug } })}
              activeOpacity={0.7}
            >
              <Text className="text-3xl">{SERVICE_ICONS[svc.icon] || '🔧'}</Text>
              <Text className="text-white font-semibold text-sm text-center">{svc.name}</Text>
              <Text className="text-surface-muted text-xs">from ₹{svc.base_price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* How it works */}
      <View className="bg-surface-card border border-surface-border rounded-3xl p-5 mt-6">
        <Text className="text-white text-lg font-bold mb-4">How it works</Text>
        {STEPS.map((s, i) => (
          <View key={s.title} className={`flex-row items-center gap-3 py-2.5 ${i < STEPS.length - 1 ? 'border-b border-surface-border' : ''}`}>
            <View className="w-6 h-6 bg-brand-500 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">{s.n}</Text>
            </View>
            <Text className="text-xl">{s.icon}</Text>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">{s.title}</Text>
              <Text className="text-surface-muted text-xs mt-0.5">{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
