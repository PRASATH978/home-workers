import { Tabs } from 'expo-router'
import { COLORS } from '../../src/utils/theme'
import { Text } from 'react-native'

const TAB_ICON = { index: '🏠', jobs: '📋', profile: '👤', subscribe: '👑' }

export default function WorkerTabsLayout() {
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
      <Tabs.Screen name="index"     options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="jobs"      options={{ title: 'Jobs' }} />
      <Tabs.Screen name="profile"   options={{ title: 'Profile' }} />
      <Tabs.Screen name="subscribe" options={{ title: 'Upgrade' }} />
    </Tabs>
  )
}
