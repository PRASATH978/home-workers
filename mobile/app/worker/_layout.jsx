import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

function TabIcon({ emoji, focused }) {
  return focused ? (
    <LinearGradient
      colors={['#833ab4','#c13584','#fd1d1d']}
      start={{ x:0, y:0 }} end={{ x:1, y:1 }}
      style={styles.iconActive}
    >
      <Text style={{ fontSize:18 }}>{emoji}</Text>
    </LinearGradient>
  ) : (
    <View style={styles.iconInactive}>
      <Text style={{ fontSize:18, opacity:0.45 }}>{emoji}</Text>
    </View>
  )
}

const TABS = {
  index:     { emoji:'🏠', label:'Dashboard' },
  jobs:      { emoji:'📋', label:'Jobs'      },
  profile:   { emoji:'👤', label:'Profile'   },
  subscribe: { emoji:'👑', label:'Upgrade'   },
}

export default function WorkerTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   '#c13584',
        tabBarInactiveTintColor: '#737373',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji={TABS[route.name]?.emoji || '⚙️'} focused={focused} />
        ),
      })}
    >
      <Tabs.Screen name="index"     options={{ title:'Dashboard' }} />
      <Tabs.Screen name="jobs"      options={{ title:'Jobs'      }} />
      <Tabs.Screen name="profile"   options={{ title:'Profile'   }} />
      <Tabs.Screen name="subscribe" options={{ title:'Upgrade'   }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a0a0a',
    borderTopColor:  '#1a1a1a',
    borderTopWidth:  1,
    height: 70,
    paddingBottom: 10,
    paddingTop: 6,
  },
  tabLabel: { fontSize:10, fontWeight:'600', marginTop:2 },
  iconActive:   { width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center' },
  iconInactive: { width:38, height:38, alignItems:'center', justifyContent:'center' },
})
