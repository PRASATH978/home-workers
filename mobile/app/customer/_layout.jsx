import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

function TabIcon({ emoji, focused }) {
  return focused ? (
    <LinearGradient
      colors={['#2563EB', '#1D4ED8']}
      style={styles.iconActive}
    >
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </LinearGradient>
  ) : (
    <View style={styles.iconInactive}>
      <Text style={{ fontSize: 18, opacity: 0.45 }}>{emoji}</Text>
    </View>
  )
}

const TABS = {
  index:    { emoji: '🏠', label: 'Home'     },
  workers:  { emoji: '👷', label: 'Workers'  },
  bookings: { emoji: '📋', label: 'Bookings' },
  profile:  { emoji: '👤', label: 'Profile'  },
}

export default function CustomerTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji={TABS[route.name]?.emoji || '⚙️'} focused={focused} />
        ),
      })}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home'     }} />
      <Tabs.Screen name="workers"  options={{ title: 'Workers'  }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile'  }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor:  '#F1F5F9',
    borderTopWidth:  1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  iconActive: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInactive: {
    width: 38, height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
