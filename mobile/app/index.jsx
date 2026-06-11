import { Redirect } from 'expo-router'
import { useSelector } from 'react-redux'

export default function Index() {
  const { user, access } = useSelector(s => s.auth)
  if (!access) return <Redirect href="/auth/login" />
  if (user?.role === 'worker') return <Redirect href="/worker" />
  return <Redirect href="/customer" />
}
