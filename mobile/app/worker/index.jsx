import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, StyleSheet,
} from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { fetchWorkerProfile, toggleAvailability, fetchWorkerJobs } from '../../src/store/slices'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'

export default function WorkerDashboardScreen() {
  const dispatch = useDispatch()
  const { profile } = useSelector(s => s.workers)
  const { availableJobs } = useSelector(s => s.bookings)
  const user = useSelector(s => s.auth.user)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => Promise.all([
    dispatch(fetchWorkerProfile()),
    dispatch(fetchWorkerJobs('available')),
    dispatch(fetchWorkerJobs('mine')),
  ])

  useEffect(() => { load() }, [])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const handleToggle = async () => {
    try {
      await api.post('/workers/profile/toggle-availability/')
      dispatch(toggleAvailability())
      Toast.show({ type:'success', text1: profile?.is_available ? 'You are now offline' : 'You are now online! 🟢' })
    } catch {
      Toast.show({ type:'error', text1:'Failed to update' })
    }
  }

  const stats = [
    { icon:'💼', label:'Total Jobs',  value: profile?.total_jobs ?? 0,              color:'#c13584' },
    { icon:'⭐', label:'Rating',      value: `${profile?.avg_rating ?? 0}`,          color:'#ffad08' },
    { icon:'💬', label:'Reviews',     value: profile?.rating_count ?? 0,             color:'#0095f6' },
    { icon:'👑', label:'Plan',        value: (profile?.subscription_plan ?? 'BASIC').toUpperCase(), color:'#833ab4' },
  ]

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c13584" />}
    >
      {/* Hero header */}
      <LinearGradient colors={['#1a0533','#2d0a4e','#000']} style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.heroSub}>
              {profile?.verification_status === 'verified'
                ? '✅ Verified Worker'
                : `⚠️ ${profile?.verification_status || 'Pending'}`}
            </Text>
          </View>

          {/* Online toggle */}
          <TouchableOpacity
            onPress={handleToggle}
            style={{ borderRadius:20, overflow:'hidden' }}
            activeOpacity={0.8}
          >
            {profile?.is_available ? (
              <LinearGradient
                colors={['#00ba7c','#00c896']}
                start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                style={styles.toggleBtn}
              >
                <Text style={styles.toggleText}>🟢 Online</Text>
              </LinearGradient>
            ) : (
              <View style={styles.toggleBtnOff}>
                <Text style={styles.toggleTextOff}>⚫ Offline</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Verification alert */}
        {profile?.verification_status !== 'verified' && (
          <TouchableOpacity
            style={styles.verifyAlert}
            onPress={() => router.push('/worker/profile')}
          >
            <Text style={styles.verifyAlertText}>
              {profile?.verification_status === 'rejected'
                ? '⚠️ Verification rejected — tap to re-submit ID'
                : '⚠️ Complete your profile to get verified →'}
            </Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsGrid}>
        {stats.map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{s.icon}</Text>
            <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Available jobs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Available Jobs{' '}
          <Text style={{ color:'#c13584' }}>({availableJobs.length})</Text>
        </Text>
        <TouchableOpacity onPress={() => router.push('/worker/jobs')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {availableJobs.length === 0 ? (
        <LinearGradient colors={['#121212','#0d0d0d']} style={styles.emptyJobs}>
          <Text style={{ fontSize:40, marginBottom:8 }}>📭</Text>
          <Text style={styles.emptyTitle}>No jobs right now</Text>
          <Text style={styles.emptySub}>Stay online to get notified</Text>
        </LinearGradient>
      ) : (
        availableJobs.slice(0, 3).map(job => (
          <TouchableOpacity
            key={job.id}
            style={styles.jobCard}
            onPress={() => router.push('/worker/jobs')}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={['#833ab4','#c13584']}
              style={styles.jobDot}
            >
              <Text style={{ color:'#fff', fontSize:11, fontWeight:'700' }}>NEW</Text>
            </LinearGradient>
            <View style={{ flex:1 }}>
              <Text style={styles.jobService}>{job.service?.name}</Text>
              <Text style={styles.jobDesc} numberOfLines={1}>{job.problem_description}</Text>
              <Text style={styles.jobAddr} numberOfLines={1}>📍 {job.address}</Text>
            </View>
            <Text style={{ color:'#c13584', fontSize:20 }}>›</Text>
          </TouchableOpacity>
        ))
      )}

      {/* Upgrade CTA */}
      {profile?.subscription_plan === 'basic' && (
        <TouchableOpacity
          onPress={() => router.push('/worker/subscribe')}
          style={{ borderRadius:22, overflow:'hidden', marginTop:8 }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1a0533','#2d0a4e']}
            style={styles.upgradeCta}
          >
            <LinearGradient
              colors={['#833ab4','#c13584','#fd1d1d']}
              start={{ x:0,y:0 }} end={{ x:1,y:0 }}
              style={styles.upgradeIcon}
            >
              <Text style={{ fontSize:20 }}>👑</Text>
            </LinearGradient>
            <View style={{ flex:1 }}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSub}>Unlimited leads · ₹199/month</Text>
            </View>
            <Text style={{ color:'#c13584', fontSize:20 }}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#000' },
  content: { paddingBottom:32 },

  hero:        { paddingTop:56, paddingBottom:24, paddingHorizontal:20, overflow:'hidden' },
  heroCircle1: { position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:90, backgroundColor:'#833ab4', opacity:0.15 },
  heroCircle2: { position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:80, backgroundColor:'#fd1d1d', opacity:0.08 },
  heroTop:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  greeting:    { color:'#fff', fontSize:24, fontWeight:'800', marginBottom:3 },
  heroSub:     { color:'#a8a8a8', fontSize:12 },
  toggleBtn:   { paddingHorizontal:16, paddingVertical:8, borderRadius:20 },
  toggleText:  { color:'#fff', fontWeight:'700', fontSize:13 },
  toggleBtnOff:{ paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:'#1a1a1a', borderWidth:1, borderColor:'#262626' },
  toggleTextOff:{ color:'#737373', fontWeight:'600', fontSize:13 },
  verifyAlert: { backgroundColor:'rgba(255,173,8,0.1)', borderRadius:14, padding:12, borderWidth:1, borderColor:'rgba(255,173,8,0.3)' },
  verifyAlertText:{ color:'#ffad08', fontSize:12, fontWeight:'500' },

  statsGrid: { flexDirection:'row', flexWrap:'wrap', padding:16, gap:10 },
  statCard:  { width:'47%', backgroundColor:'#121212', borderRadius:20, padding:16, alignItems:'center', borderWidth:1, borderColor:'#262626' },
  statIcon:  { fontSize:24, marginBottom:6 },
  statVal:   { fontSize:24, fontWeight:'800', marginBottom:3 },
  statLabel: { color:'#737373', fontSize:11 },

  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, marginBottom:10 },
  sectionTitle:  { color:'#fff', fontSize:17, fontWeight:'700' },
  seeAll:        { color:'#c13584', fontSize:13, fontWeight:'600' },

  emptyJobs:  { marginHorizontal:16, borderRadius:22, padding:28, alignItems:'center', borderWidth:1, borderColor:'#262626' },
  emptyTitle: { color:'#fff', fontSize:14, fontWeight:'600', marginBottom:4 },
  emptySub:   { color:'#737373', fontSize:12 },

  jobCard:    { flexDirection:'row', alignItems:'center', gap:12, marginHorizontal:16, marginBottom:10, backgroundColor:'#121212', borderRadius:18, padding:16, borderWidth:1, borderColor:'#262626' },
  jobDot:     { paddingHorizontal:8, paddingVertical:4, borderRadius:8 },
  jobService: { color:'#fff', fontSize:14, fontWeight:'700', marginBottom:2 },
  jobDesc:    { color:'#737373', fontSize:12, marginBottom:2 },
  jobAddr:    { color:'#363636', fontSize:11 },

  upgradeCta:  { marginHorizontal:16, padding:18, borderRadius:22, flexDirection:'row', alignItems:'center', gap:14, borderWidth:1, borderColor:'#833ab4' + '40' },
  upgradeIcon: { width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center' },
  upgradeTitle:{ color:'#fff', fontSize:15, fontWeight:'700' },
  upgradeSub:  { color:'#a8a8a8', fontSize:12, marginTop:2 },
})
