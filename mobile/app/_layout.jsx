import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from '../src/store'
import { loadUser } from '../src/store/authSlice'
import { View, ActivityIndicator } from 'react-native'
import Toast from 'react-native-toast-message'

function RootLayoutInner() {
  const dispatch = useDispatch()
  const { isBootstrapped } = useSelector(s => s.auth)

  useEffect(() => { dispatch(loadUser()) }, [])

  if (!isBootstrapped) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    )
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast />
    </>
  )
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootLayoutInner />
    </Provider>
  )
}
