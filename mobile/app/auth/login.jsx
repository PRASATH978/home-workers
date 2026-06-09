import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { login } from '../../src/store/authSlice'
import Toast from 'react-native-toast-message'

export default function LoginScreen() {
  const dispatch = useDispatch()
  const { isLoading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ phone: '', password: '' })

  const handleLogin = async () => {
    if (!form.phone || !form.password)
      return Toast.show({ type: 'error', text1: 'Fill in all fields' })
    const res = await dispatch(login(form))
    if (res.meta.requestStatus === 'fulfilled') {
      const user = res.payload.user
      Toast.show({ type: 'success', text1: `Welcome, ${user.name}!` })
      router.replace(user.role === 'worker' ? '/worker' : '/customer')
    } else {
      Toast.show({ type: 'error', text1: 'Invalid phone or password' })
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
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-brand-500 rounded-2xl items-center justify-center mb-3">
            <Text className="text-3xl">🔧</Text>
          </View>
          <Text className="text-white text-3xl font-extrabold">
            Local<Text className="text-brand-500">Service</Text>
          </Text>
          <Text className="text-surface-muted mt-1 text-sm">Sign in to continue</Text>
        </View>

        {/* Card */}
        <View className="bg-surface-card border border-surface-border rounded-3xl p-6">
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
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={form.password}
            onChangeText={v => setForm({ ...form, password: v })}
          />

          <TouchableOpacity
            className={`bg-brand-500 rounded-xl py-4 items-center mt-5 ${isLoading ? 'opacity-60' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-white font-bold text-base">
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/register')} className="items-center mt-4">
            <Text className="text-surface-muted text-sm">
              No account?{' '}
              <Text className="text-brand-400 font-semibold">Register here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
