import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { register } from '../../src/store/authSlice'
import Toast from 'react-native-toast-message'

export default function RegisterScreen() {
  const dispatch = useDispatch()
  const { isLoading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'customer' })

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password)
      return Toast.show({ type: 'error', text1: 'Fill in all fields' })
    if (form.password.length < 6)
      return Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' })
    const res = await dispatch(register(form))
    if (res.meta.requestStatus === 'fulfilled') {
      Toast.show({ type: 'success', text1: 'Account created!' })
      router.replace(form.role === 'worker' ? '/worker' : '/customer')
    } else {
      const err = res.payload
      Toast.show({ type: 'error', text1: err?.phone?.[0] || 'Registration failed' })
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View className="items-center mb-7">
          <View className="w-14 h-14 bg-brand-500 rounded-2xl items-center justify-center mb-3">
            <Text className="text-2xl">🔧</Text>
          </View>
          <Text className="text-white text-2xl font-extrabold">
            Local<Text className="text-brand-500">Service</Text>
          </Text>
          <Text className="text-surface-muted mt-1 text-sm">Create your account</Text>
        </View>

        <View className="bg-surface-card border border-surface-border rounded-3xl p-6">
          {/* Role Toggle */}
          <View className="flex-row bg-surface rounded-xl p-1 mb-5 gap-2">
            {[
              { key: 'customer', label: '🙋 I need services' },
              { key: 'worker',   label: '🔧 I am a worker' },
            ].map(r => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setForm({ ...form, role: r.key })}
                className={`flex-1 py-2.5 rounded-lg items-center ${form.role === r.key ? 'bg-brand-500' : ''}`}
              >
                <Text className={`font-semibold text-sm ${form.role === r.key ? 'text-white' : 'text-surface-muted'}`}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-slate-400 text-sm mb-1.5">Full Name</Text>
          <TextInput
            className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-base mb-4"
            placeholder="Ravi Kumar"
            placeholderTextColor="#64748b"
            value={form.name}
            onChangeText={v => setForm({ ...form, name: v })}
          />

          <Text className="text-slate-400 text-sm mb-1.5">Phone Number</Text>
          <TextInput
            className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-base mb-4"
            placeholder="9876543210"
            placeholderTextColor="#64748b"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={v => setForm({ ...form, phone: v })}
          />

          <Text className="text-slate-400 text-sm mb-1.5">Password</Text>
          <TextInput
            className="bg-surface border border-surface-border rounded-xl px-4 py-3 text-white text-base"
            placeholder="Min 6 characters"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={form.password}
            onChangeText={v => setForm({ ...form, password: v })}
          />

          <TouchableOpacity
            className={`bg-brand-500 rounded-xl py-4 items-center mt-5 ${isLoading ? 'opacity-60' : ''}`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-white font-bold text-base">
              {isLoading ? 'Creating…' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')} className="items-center mt-4">
            <Text className="text-surface-muted text-sm">
              Have an account?{' '}
              <Text className="text-brand-400 font-semibold">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
