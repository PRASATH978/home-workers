import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchWorkerProfile, fetchServices } from '../../src/store/slices'
import * as ImagePicker from 'expo-image-picker'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'
import { logout } from '../../src/store/authSlice'
import { router } from 'expo-router'

const ID_TYPES = [['aadhaar','Aadhaar'],['pan','PAN'],['voter','Voter ID'],['licence','Licence']]

export default function WorkerProfileScreen() {
  const dispatch = useDispatch()
  const { profile } = useSelector(s => s.workers)
  const { items: services } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ bio:'', experience_years:'0', service_radius_km:'10', id_proof_type:'', service_ids:[] })

  useEffect(() => { dispatch(fetchWorkerProfile()); dispatch(fetchServices()) }, [])
  useEffect(() => {
    if (profile) setForm({
      bio: profile.bio || '',
      experience_years: String(profile.experience_years || 0),
      service_radius_km: String(profile.service_radius_km || 10),
      id_proof_type: profile.id_proof_type || '',
      service_ids: profile.services?.map(s => s.id) || [],
    })
  }, [profile])

  const toggleService = id => setForm(f => ({
    ...f,
    service_ids: f.service_ids.includes(id) ? f.service_ids.filter(s => s !== id) : [...f.service_ids, id],
  }))

  const pickID = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
    if (!result.canceled) {
      const file = result.assets[0]
      const fd = new FormData()
      fd.append('id_proof_image', { uri: file.uri, type: 'image/jpeg', name: 'id.jpg' })
      await api.patch('/workers/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      Toast.show({ type: 'success', text1: 'ID uploaded!' })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const fd = new FormData()
      fd.append('bio', form.bio)
      fd.append('experience_years', form.experience_years)
      fd.append('service_radius_km', form.service_radius_km)
      fd.append('id_proof_type', form.id_proof_type)
      form.service_ids.forEach(id => fd.append('service_ids', id))
      await api.patch('/workers/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      Toast.show({ type: 'success', text1: 'Profile updated!' })
      dispatch(fetchWorkerProfile())
    } catch { Toast.show({ type: 'error', text1: 'Failed to save' }) }
    setIsSaving(false)
  }

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-4 pb-10" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row justify-between items-center pt-14 mb-5">
        <Text className="text-white text-2xl font-extrabold">My Profile</Text>
        <Text className={`text-sm font-semibold capitalize ${profile?.verification_status === 'verified' ? 'text-emerald-400' : 'text-yellow-400'}`}>
          {profile?.verification_status || 'pending'}
        </Text>
      </View>

      {/* Avatar */}
      <View className="items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-brand-500 items-center justify-center mb-3">
          <Text className="text-brand-400 text-3xl font-extrabold">{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text className="text-white text-lg font-bold">{user?.name}</Text>
        <Text className="text-surface-muted text-sm mt-1">{user?.phone}</Text>
      </View>

      {/* Services */}
      <View className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-4">
        <Text className="text-white font-bold text-base mb-4">Services You Offer</Text>
        <View className="flex-row flex-wrap gap-2">
          {services.map(s => (
            <TouchableOpacity
              key={s.id}
              onPress={() => toggleService(s.id)}
              className={`px-3 py-1.5 rounded-full border ${form.service_ids.includes(s.id) ? 'bg-brand-500 border-brand-500' : 'bg-surface border-surface-border'}`}
            >
              <Text className={`text-xs font-medium ${form.service_ids.includes(s.id) ? 'text-white' : 'text-surface-muted'}`}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* About */}
      <View className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-4 gap-4">
        <Text className="text-white font-bold text-base">About You</Text>
        <View>
          <Text className="text-slate-400 text-sm mb-1.5">Bio</Text>
          <TextInput
            className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm"
            placeholder="Describe your experience…"
            placeholderTextColor="#64748b"
            multiline textAlignVertical="top"
            style={{ minHeight: 80 }}
            value={form.bio}
            onChangeText={v => setForm({ ...form, bio: v })}
          />
        </View>
        <View>
          <Text className="text-slate-400 text-sm mb-1.5">Years of Experience</Text>
          <TextInput className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm" keyboardType="number-pad" value={form.experience_years} onChangeText={v => setForm({ ...form, experience_years: v })} placeholderTextColor="#64748b" />
        </View>
        <View>
          <Text className="text-slate-400 text-sm mb-1.5">Service Radius (km)</Text>
          <TextInput className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm" keyboardType="number-pad" value={form.service_radius_km} onChangeText={v => setForm({ ...form, service_radius_km: v })} placeholderTextColor="#64748b" />
        </View>
      </View>

      {/* ID Proof */}
      <View className="bg-surface-card border border-surface-border rounded-2xl p-5 mb-4 gap-4">
        <Text className="text-white font-bold text-base">ID Verification</Text>
        <View className="flex-row flex-wrap gap-2">
          {ID_TYPES.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setForm({ ...form, id_proof_type: key })}
              className={`px-3 py-2 rounded-xl border ${form.id_proof_type === key ? 'bg-brand-500 border-brand-500' : 'bg-surface border-surface-border'}`}
            >
              <Text className={`text-xs ${form.id_proof_type === key ? 'text-white font-semibold' : 'text-surface-muted'}`}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          className="bg-surface border border-dashed border-surface-border rounded-xl py-4 items-center"
          onPress={pickID}
        >
          <Text className="text-surface-muted text-sm">
            {profile?.id_proof_image ? '✅ ID Uploaded – Tap to change' : '📷 Upload ID Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className={`bg-brand-500 rounded-2xl py-4 items-center mb-3 ${isSaving ? 'opacity-60' : ''}`}
        onPress={handleSave} disabled={isSaving}
      >
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">💾 Save Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        className="border border-red-500/30 bg-red-500/10 rounded-2xl py-4 items-center"
        onPress={() => { dispatch(logout()); router.replace('/auth/login') }}
      >
        <Text className="text-red-400 font-bold text-sm">🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
