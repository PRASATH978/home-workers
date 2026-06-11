import React, { useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { fetchServices } from '../../src/store/slices'
import * as Location from 'expo-location'
import api from '../../src/utils/api'

const { width } = Dimensions.get('window')
const CARD_W = (width - 48 - 12) / 2

const SERVICE_ICONS = {
  wrench:'🔧', bolt:'⚡', hammer:'🔨', paint:'🎨',
  snowflake:'❄️', droplet:'💧', broom:'🧹',
  car:'🚗', brick:'🧱', fire:'🔥', leaf:'🌿',
}

const STATS = [
  { val:'500+', label:'Workers',   icon:'👷' },
  { val:'12K+', label:'Jobs Done', icon:'✅' },
  { val:'8',    label:'Cities',    icon:'📍' },
]

const STEPS = [
  { icon:'📱', n:'1', title:'Choose Service', desc:'Pick from 11 categories' },
  { icon:'👷', n:'2', title:'Pick Worker',    desc:'Verified pros near you'  },
  { icon:'📅', n:'3', title:'Book & Pay',     desc:'Easy booking process'    },
  { icon:'⭐', n:'4', title:'Rate & Review',  desc:'Share your experience'   },
]

export default function CustomerHomeScreen() {
  const dispatch = useDispatch()
  const { items: services, isLoading } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)

  useEffect(() => {
    dispatch(fetchServices())
    requestLocation()
  }, [])

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({})
      api.post('/auth/location/', {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }).catch(() => {})
    } catch {}
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={['#2563EB', '#1D4ED8']}
        style={styles.hero}
      >
        <View style={styles.heroBlob} />
        <Text style={styles.heroGreeting}>
          Hello, {user?.name?.split(' ')[0] || 'there'} 👋
        </Text>
        <Text style={styles.heroTitle}>
          Find trusted{'\n'}home services
        </Text>
        <Text style={styles.heroSub}>
          📍 {user?.city || 'Krishnagiri, Tamil Nadu'}
        </Text>
        <TouchableOpacity
          style={styles.heroBtn}
          onPress={() => router.push('/customer/workers')}
          activeOpacity={0.85}
        >
          <Text style={styles.heroBtnText}>🔍  Find Workers Near You</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {STATS.map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Services */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Our Services</Text>
        <TouchableOpacity onPress={() => router.push('/customer/workers')}>
          <Text style={styles.sectionLink}>See all →</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.grid}>
          {services.map(svc => (
            <TouchableOpacity
              key={svc.slug}
              style={styles.serviceCard}
              onPress={() => router.push({ pathname: '/customer/workers', params: { service: svc.slug } })}
              activeOpacity={0.75}
            >
              <View style={styles.serviceIconWrap}>
                <Text style={styles.serviceEmoji}>{SERVICE_ICONS[svc.icon] || '🔧'}</Text>
              </View>
              <Text style={styles.serviceName}>{svc.name}</Text>
              <Text style={styles.servicePrice}>from ₹{svc.base_price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* How it works */}
      <View style={styles.howCard}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        {STEPS.map((s, i) => (
          <View key={s.title} style={[styles.step, i < STEPS.length - 1 && styles.stepBorder]}>
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.stepNum}>
              <Text style={styles.stepNumText}>{s.n}</Text>
            </LinearGradient>
            <Text style={styles.stepIcon}>{s.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 32 },

  hero:        { margin: 16, borderRadius: 24, padding: 24, overflow: 'hidden', marginTop: 56 },
  heroBlob:    { position:'absolute', top:-60, right:-60, width:180, height:180, borderRadius:90, backgroundColor:'#fff', opacity:0.06 },
  heroGreeting:{ color:'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500', marginBottom: 6 },
  heroTitle:   { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 34, marginBottom: 8 },
  heroSub:     { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 20 },
  heroBtn:     { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  heroBtnText: { color: '#2563EB', fontWeight: '700', fontSize: 15 },

  statsRow:  { flexDirection:'row', paddingHorizontal:16, gap:10, marginBottom:24 },
  statCard:  { flex:1, backgroundColor:'#fff', borderRadius:16, paddingVertical:14, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  statIcon:  { fontSize:20, marginBottom:4 },
  statVal:   { color:'#2563EB', fontSize:18, fontWeight:'800' },
  statLabel: { color:'#64748B', fontSize:11, marginTop:2 },

  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, marginBottom:14 },
  sectionTitle:  { color:'#0F172A', fontSize:18, fontWeight:'700' },
  sectionLink:   { color:'#2563EB', fontSize:13, fontWeight:'600' },

  grid:         { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:16, gap:12, marginBottom:24 },
  serviceCard:  { width: CARD_W, backgroundColor:'#fff', borderRadius:18, padding:16, alignItems:'center', shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  serviceIconWrap:{ width:52, height:52, backgroundColor:'#EFF6FF', borderRadius:16, alignItems:'center', justifyContent:'center', marginBottom:10 },
  serviceEmoji: { fontSize:26 },
  serviceName:  { color:'#0F172A', fontSize:13, fontWeight:'600', textAlign:'center', marginBottom:4 },
  servicePrice: { color:'#64748B', fontSize:11 },

  howCard:   { backgroundColor:'#fff', marginHorizontal:16, borderRadius:20, padding:20, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  step:      { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14 },
  stepBorder:{ borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  stepNum:   { width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center', flexShrink:0 },
  stepNumText:{ color:'#fff', fontSize:12, fontWeight:'800' },
  stepIcon:  { fontSize:22 },
  stepTitle: { color:'#0F172A', fontSize:14, fontWeight:'600' },
  stepDesc:  { color:'#64748B', fontSize:12, marginTop:2 },
})
