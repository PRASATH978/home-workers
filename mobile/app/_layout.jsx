import '../global.css'
import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { Provider, useDispatch, useSelector } from 'react-redux'
import { store } from '../src/store/index'
import { loadUser } from '../src/store/authSlice'
import { View, ActivityIndicator } from 'react-native'
import Toast from 'react-native-toast-message'

function RootLayoutInner() {
  const dispatch = useDispatch()
  const { isBootstrapped } = useSelector(s => s.auth)

  useEffect(() => { dispatch(loadUser()) }, [])

  if (!isBootstrapped) {
    return (
      <View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color="#c13584" size="large" />
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
