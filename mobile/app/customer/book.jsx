import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router, useLocalSearchParams } from 'expo-router'
import { createBooking, fetchServices } from '../../src/store/slices'
import Toast from 'react-native-toast-message'

export default function BookScreen() {
  const dispatch = useDispatch()
  const { items: services } = useSelector(s => s.services)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [form, setForm] = useState({ service: null, serviceName: '', problem_description: '', address: '' })

  useEffect(() => { dispatch(fetchServices()) }, [])

  const handleSubmit = async () => {
    if (!form.service) return Toast.show({ type: 'error', text1: 'Select a service' })
    if (!form.problem_description.trim()) return Toast.show({ type: 'error', text1: 'Describe your problem' })
    if (!form.address.trim()) return Toast.show({ type: 'error', text1: 'Enter your address' })
    setIsSubmitting(true)
    const res = await dispatch(createBooking({ service: form.service, problem_description: form.problem_description, address: form.address }))
    setIsSubmitting(false)
    if (res.meta.requestStatus === 'fulfilled') {
      Toast.show({ type: 'success', text1: 'Booking created!', text2: 'Workers will be notified' })
      router.replace('/customer/bookings')
    } else {
      Toast.show({ type: 'error', text1: 'Failed to create booking' })
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerClassName="px-4 pt-14 pb-10" keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-brand-400 text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-extrabold mb-6">Book Service</Text>

        <View className="bg-surface-card border border-surface-border rounded-3xl p-5 gap-4">
          {/* Service picker */}
          <View>
            <Text className="text-slate-400 text-sm mb-1.5">Service Type *</Text>
            <TouchableOpacity
              className="bg-surface border border-surface-border rounded-xl px-4 py-3 flex-row justify-between items-center"
              onPress={() => setMenuOpen(!menuOpen)}
            >
              <Text className={form.service ? 'text-white text-sm' : 'text-surface-muted text-sm'}>
                {form.serviceName || 'Select a service…'}
              </Text>
              <Text className="text-surface-muted">▾</Text>
            </TouchableOpacity>
            {menuOpen && (
              <View className="bg-surface border border-surface-border rounded-xl mt-1 overflow-hidden">
                {services.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    className="flex-row justify-between items-center px-4 py-3 border-b border-surface-border"
                    onPress={() => { setForm({ ...form, service: s.id, serviceName: `${s.name} – from ₹${s.base_price}` }); setMenuOpen(false) }}
                  >
                    <Text className="text-white text-sm">{s.name}</Text>
                    <Text className="text-surface-muted text-xs">from ₹{s.base_price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Problem */}
          <View>
            <Text className="text-slate-400 text-sm mb-1.5">Problem Description *</Text>
            <TextInput
              className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm"
              placeholder={"Describe your problem in detail…\ne.g. Bathroom tap is leaking"}
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 90 }}
              value={form.problem_description}
              onChangeText={v => setForm({ ...form, problem_description: v })}
            />
          </View>

          {/* Address */}
          <View>
            <Text className="text-slate-400 text-sm mb-1.5">Service Address *</Text>
            <TextInput
              className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-sm"
              placeholder="No. 12, Gandhi Nagar, Krishnagiri – 635001"
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              style={{ minHeight: 60 }}
              value={form.address}
              onChangeText={v => setForm({ ...form, address: v })}
            />
          </View>

          <TouchableOpacity
            className={`bg-brand-500 rounded-xl py-4 items-center mt-1 ${isSubmitting ? 'opacity-60' : ''}`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-bold text-base">✅ Confirm Booking</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
