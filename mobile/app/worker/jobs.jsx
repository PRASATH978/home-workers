import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Linking,
  RefreshControl, StyleSheet,
} from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { fetchWorkerJobs, workerJobAction } from '../../src/store/slices'
import { format } from 'date-fns'
import Toast from 'react-native-toast-message'

const STATUS_STYLE = {
  pending:     { bg:'#2a1800', text:'#ffad08', label:'Pending'     },
  accepted:    { bg:'#001a2e', text:'#0095f6', label:'Accepted'    },
  in_progress: { bg:'#001a2e', text:'#0095f6', label:'In Progress' },
  completed:   { bg:'#00150d', text:'#00ba7c', label:'Completed'   },
}

function JobCard({ job, onAction }) {
  const [otp,     setOtp]     = useState('')
  const [price,   setPrice]   = useState('')
  const [loading, setLoading] = useState(null)
  const [focused, setFocused] = useState('')

  const act = async (action) => {
    setLoading(action)
    await onAction(job.id, action, { otp, final_price: price ? parseInt(price) : undefined })
    setLoading(null)
  }

  const s = STATUS_STYLE[job.status] || { bg:'#1a1a1a', text:'#a8a8a8', label: job.status }

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['#833ab4','#c13584','#fd1d1d']}
        start={{ x:0,y:0 }} end={{ x:1,y:0 }}
        style={styles.cardBar}
      />
      <View style={styles.cardContent}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <View style={{ flex:1 }}>
            <Text style={styles.jobService}>{job.service?.name}</Text>
            <Text style={styles.jobDesc} numberOfLines={2}>{job.problem_description}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{s.label}</Text>
          </View>
        </View>

        {/* Meta */}
        <Text style={styles.meta}>📍 {job.address}</Text>
        <Text style={styles.meta}>📅 {format(new Date(job.created_at), 'dd MMM, hh:mm a')}</Text>
        {job.customer?.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${job.customer.phone}`)}>
            <Text style={styles.callLink}>📞 Call customer: {job.customer.phone}</Text>
          </TouchableOpacity>
        )}
        {job.final_price && (
          <Text style={styles.finalPrice}>💰 ₹{job.final_price}</Text>
        )}

        {/* Actions */}
        {job.status === 'pending' && (
          <TouchableOpacity
            onPress={() => act('accept')}
            disabled={loading === 'accept'}
            style={{ borderRadius:14, overflow:'hidden', marginTop:14 }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading === 'accept' ? ['#333','#222'] : ['#833ab4','#c13584']}
              start={{ x:0,y:0 }} end={{ x:1,y:0 }}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>
                {loading === 'accept' ? '…' : '✅  Accept Job'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {job.status === 'accepted' && (
          <TouchableOpacity
            onPress={() => act('start')}
            disabled={loading === 'start'}
            style={{ borderRadius:14, overflow:'hidden', marginTop:14 }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading === 'start' ? ['#333','#222'] : ['#0095f6','#005fa3']}
              start={{ x:0,y:0 }} end={{ x:1,y:0 }}
              style={styles.actionBtn}
            >
              <Text style={styles.actionBtnText}>
                {loading === 'start' ? '…' : '▶️  Start Job'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {job.status === 'in_progress' && (
          <View style={{ marginTop:14, gap:10 }}>
            <View style={styles.otpHint}>
              <Text style={styles.otpHintText}>🔐 Ask customer for their 4-digit OTP</Text>
            </View>
            <TextInput
              style={[styles.input, focused === 'otp' && styles.inputFocused]}
              placeholder="Enter OTP"
              placeholderTextColor="#737373"
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
              onFocus={() => setFocused('otp')}
              onBlur={() => setFocused('')}
              textAlign="center"
            />
            <TextInput
              style={[styles.input, focused === 'price' && styles.inputFocused]}
              placeholder="Final price ₹"
              placeholderTextColor="#737373"
              keyboardType="number-pad"
              value={price}
              onChangeText={setPrice}
              onFocus={() => setFocused('price')}
              onBlur={() => setFocused('')}
            />
            <TouchableOpacity
              onPress={() => act('complete')}
              disabled={loading === 'complete'}
              style={{ borderRadius:14, overflow:'hidden' }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={loading === 'complete' ? ['#333','#222'] : ['#00ba7c','#00c896']}
                start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                style={styles.actionBtn}
              >
                <Text style={styles.actionBtnText}>
                  {loading === 'complete' ? '…' : '✔️  Mark Complete'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {job.status === 'completed' && (
          <Text style={styles.doneText}>✔️ Job completed successfully</Text>
        )}
      </View>
    </View>
  )
}

export default function WorkerJobsScreen() {
  const dispatch = useDispatch()
  const { availableJobs, myJobs, isLoading } = useSelector(s => s.bookings)
  const [tab,        setTab]        = useState('available')
  const [refreshing, setRefreshing] = useState(false)

  const load = () => {
    dispatch(fetchWorkerJobs('available'))
    dispatch(fetchWorkerJobs('mine'))
  }

  useEffect(() => { load() }, [])
  const onRefresh = async () => { setRefreshing(true); load(); setRefreshing(false) }

  const handleAction = async (bookingId, action, extra) => {
    const res = await dispatch(workerJobAction({ bookingId, action, ...extra }))
    if (res.meta.requestStatus === 'fulfilled') {
      Toast.show({ type:'success', text1:`Job ${action}ed!` })
      load()
    } else {
      Toast.show({ type:'error', text1: res.payload?.error || `Failed to ${action}` })
    }
  }

  const jobs = tab === 'available' ? availableJobs : myJobs

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jobs</Text>
        <Text style={styles.headerSub}>Manage your service requests</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabWrap}>
        {[['available','Available'], ['mine','My Jobs']].map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={{ flex:1, borderRadius:14, overflow:'hidden' }}
            onPress={() => setTab(key)}
            activeOpacity={0.8}
          >
            {tab === key ? (
              <LinearGradient
                colors={['#833ab4','#c13584']}
                start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                style={styles.tabActive}
              >
                <Text style={styles.tabActiveText}>
                  {label} ({key === 'available' ? availableJobs.length : myJobs.length})
                </Text>
              </LinearGradient>
            ) : (
              <View style={styles.tabInactive}>
                <Text style={styles.tabInactiveText}>
                  {label} ({key === 'available' ? availableJobs.length : myJobs.length})
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && !refreshing ? (
        <ActivityIndicator color="#c13584" style={{ marginTop:40 }} />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={j => String(j.id)}
          renderItem={({ item }) => <JobCard job={item} onAction={handleAction} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c13584" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize:48, marginBottom:12 }}>📭</Text>
              <Text style={styles.emptyTitle}>
                {tab === 'available' ? 'No available jobs' : 'No active jobs'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'available' ? 'Stay online to get notified' : 'Accept jobs from Available tab'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:'#000' },
  header: { paddingHorizontal:16, paddingTop:56, paddingBottom:12 },
  headerTitle:{ color:'#fff', fontSize:26, fontWeight:'800' },
  headerSub:  { color:'#737373', fontSize:13, marginTop:2 },

  tabWrap: { flexDirection:'row', marginHorizontal:16, marginBottom:16, gap:8, backgroundColor:'#121212', borderRadius:16, padding:5, borderWidth:1, borderColor:'#262626' },
  tabActive:      { paddingVertical:10, alignItems:'center', borderRadius:12 },
  tabActiveText:  { color:'#fff', fontWeight:'700', fontSize:13 },
  tabInactive:    { paddingVertical:10, alignItems:'center', borderRadius:12 },
  tabInactiveText:{ color:'#737373', fontWeight:'500', fontSize:13 },

  list: { paddingHorizontal:16, paddingBottom:24 },
  card: { backgroundColor:'#121212', borderRadius:22, marginBottom:14, borderWidth:1, borderColor:'#262626', overflow:'hidden' },
  cardBar:     { height:3 },
  cardContent: { padding:16 },

  cardTop:     { flexDirection:'row', gap:12, marginBottom:10 },
  jobService:  { color:'#fff', fontSize:15, fontWeight:'700', marginBottom:3 },
  jobDesc:     { color:'#737373', fontSize:13, lineHeight:18 },
  badge:       { paddingHorizontal:10, paddingVertical:4, borderRadius:20, alignSelf:'flex-start' },
  badgeText:   { fontSize:11, fontWeight:'600' },

  meta:        { color:'#363636', fontSize:12, marginBottom:3 },
  callLink:    { color:'#c13584', fontSize:13, fontWeight:'500', marginTop:4, marginBottom:2 },
  finalPrice:  { color:'#00ba7c', fontWeight:'700', fontSize:14, marginTop:4 },

  actionBtn:     { paddingVertical:13, alignItems:'center', borderRadius:14 },
  actionBtnText: { color:'#fff', fontWeight:'700', fontSize:14 },

  otpHint:     { backgroundColor:'rgba(131,58,180,0.1)', borderRadius:12, padding:10, borderWidth:1, borderColor:'#833ab4' + '30' },
  otpHintText: { color:'#c13584', fontSize:12, fontWeight:'500' },
  input:       { backgroundColor:'#1a1a1a', borderRadius:14, paddingHorizontal:16, paddingVertical:13, color:'#fff', fontSize:14, borderWidth:1, borderColor:'#262626' },
  inputFocused:{ borderColor:'#c13584', borderWidth:1.5 },
  doneText:    { color:'#00ba7c', fontWeight:'600', fontSize:13, marginTop:10, textAlign:'center' },

  empty:     { alignItems:'center', paddingTop:50 },
  emptyTitle:{ color:'#fff', fontSize:15, fontWeight:'700', marginBottom:4 },
  emptySub:  { color:'#737373', fontSize:12 },
})
