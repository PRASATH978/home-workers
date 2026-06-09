import { Tabs } from 'expo-router'
import { COLORS } from '../../src/utils/theme'
import { Text } from 'react-native'

const TAB_ICON = {
  index:    '🏠',
  bookings: '📋',
  workers:  '👷',
  profile:  '👤',
}

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
            {TAB_ICON[route.name] || '⚙️'}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="workers"  options={{ title: 'Workers' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  )
}
