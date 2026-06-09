import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { logout } from '../../src/store/authSlice'

export default function CustomerProfileScreen() {
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)

  const handleLogout = () => { dispatch(logout()); router.replace('/auth/login') }

  const rows = [
    { label: 'Role', value: user?.role === 'customer' ? '🙋 Customer' : '🔧 Worker' },
    { label: 'Phone', value: user?.phone },
    { label: 'Email', value: user?.email || 'Not set' },
    { label: 'Verified', value: user?.is_phone_verified ? '✅ Yes' : '❌ No' },
  ]

  return (
    <ScrollView className="flex-1 bg-surface" contentContainerClassName="px-4 pb-10">
      <Text className="text-white text-2xl font-extrabold pt-14 mb-6">Profile</Text>

      {/* Avatar */}
      <View className="items-center mb-7">
        <View className="w-20 h-20 rounded-full bg-brand-500/20 border-2 border-brand-500 items-center justify-center mb-3">
          <Text className="text-brand-400 text-4xl font-extrabold">{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text className="text-white text-xl font-bold">{user?.name}</Text>
        <Text className="text-surface-muted text-sm mt-1">{user?.phone}</Text>
        {user?.city && <Text className="text-surface-muted text-xs mt-1">📍 {user.city}</Text>}
      </View>

      {/* Info rows */}
      <View className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden mb-4">
        {rows.map((row, i) => (
          <View key={row.label} className={`flex-row justify-between items-center px-5 py-4 ${i < rows.length - 1 ? 'border-b border-surface-border' : ''}`}>
            <Text className="text-surface-muted text-sm">{row.label}</Text>
            <Text className="text-white text-sm font-medium">{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Links */}
      <View className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden mb-4">
        <TouchableOpacity
          className="flex-row justify-between items-center px-5 py-4"
          onPress={() => router.push('/customer/bookings')}
        >
          <Text className="text-white text-sm">📋 My Bookings</Text>
          <Text className="text-surface-muted text-xl">›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="border border-red-500/30 bg-red-500/10 rounded-2xl py-4 items-center mt-2"
        onPress={handleLogout}
      >
        <Text className="text-red-400 font-bold text-sm">🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
