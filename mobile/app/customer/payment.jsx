import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, ActivityIndicator, StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'

const BUSINESS_PHONE  = '9000000000'
const WHATSAPP_NUMBER = '919000000000'

const METHODS = [
  { key:'cash',     emoji:'💵', label:'Cash',      sub:'Pay worker directly',   bg:'#D1FAE5', border:'#A7F3D0', text:'#065F46' },
  { key:'razorpay', emoji:'💳', label:'Card / UPI', sub:'Pay online securely',  bg:'#EFF6FF', border:'#BFDBFE', text:'#1D4ED8' },
  { key:'whatsapp', emoji:'💬', label:'WhatsApp',   sub:'Send payment via chat', bg:'#DCFCE7', border:'#BBF7D0', text:'#166534' },
  { key:'call',     emoji:'📞', label:'Call Us',    sub:"We'll help you pay",   bg:'#F0F9FF', border:'#BAE6FD', text:'#0369A1' },
]

export default function PaymentScreen() {
  const { bookingId } = useLocalSearchParams()
  const [booking, setBooking] = useState(null)
  const [screen,  setScreen]  = useState('main')
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [doneMethod, setDoneMethod] = useState('')

  useEffect(() => {
    api.get(`/bookings/${bookingId}/`).then(r => setBooking(r.data)).catch(() => router.back())
  }, [bookingId])

  const recordPayment = async (method) => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('booking_id', bookingId)
      fd.append('method', method)
      fd.append('transaction_id', method.toUpperCase())
      await api.post('/payments/submit-proof/', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      setDoneMethod(method)
      setDone(true)
    } catch (err) {
      Toast.show({ type:'error', text1: err.response?.data?.error || 'Something went wrong' })
    }
    setSaving(false)
  }

  if (!booking) return <View style={styles.loading}><ActivityIndicator color="#2563EB" size="large" /></View>

  // Done screen
  if (done) {
    return (
      <View style={styles.doneRoot}>
        <View style={styles.doneContent}>
          <LinearGradient colors={['#2563EB','#1D4ED8']} style={styles.doneCircle}>
            <Text style={{ fontSize:36 }}>✅</Text>
          </LinearGradient>
          <Text style={styles.doneTitle}>Payment Noted!</Text>
          <Text style={styles.doneSub}>Admin will confirm shortly</Text>
          <View style={styles.doneCard}>
            {[['Booking',`#${booking.id}`],['Amount',`₹${booking.final_price}`],['Status','⏳ Pending']].map(([k,v]) => (
              <View key={k} style={styles.doneRow}>
                <Text style={styles.doneKey}>{k}</Text>
                <Text style={styles.doneVal}>{v}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => router.replace('/customer/bookings')} activeOpacity={0.85}>
            <LinearGradient colors={['#2563EB','#1D4ED8']} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Back to Bookings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // Cash confirm
  if (screen === 'cash') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setScreen('main')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <View style={styles.methodIconWrap}><Text style={{ fontSize:48 }}>💵</Text></View>
          <Text style={styles.screenTitle}>Cash Payment</Text>
          <Text style={styles.screenSub}>Confirm you paid the worker in cash</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Pay to</Text>
            <Text style={styles.detailVal}>{booking.worker?.name}</Text>
          </View>
          <View style={[styles.detailRow, { borderTopWidth:0 }]}>
            <Text style={styles.detailKey}>Amount</Text>
            <Text style={[styles.detailVal, { fontSize:26, color:'#2563EB' }]}>₹{booking.final_price}</Text>
          </View>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            By tapping below you confirm paying <Text style={{ fontWeight:'700', color:'#0F172A' }}>₹{booking.final_price} cash</Text> to <Text style={{ fontWeight:'700', color:'#0F172A' }}>{booking.worker?.name}</Text>.
          </Text>
        </View>
        <TouchableOpacity onPress={() => recordPayment('cash')} disabled={saving} activeOpacity={0.85}>
          <LinearGradient colors={saving ? ['#94A3B8','#64748B'] : ['#059669','#047857']} style={styles.bigBtn}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.bigBtnText}>✅  Yes, I Paid Cash</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // WhatsApp
  if (screen === 'whatsapp') {
    const msg = encodeURIComponent(`Hi, confirming payment.\nBooking: #${booking.id}\nAmount: ₹${booking.final_price}`)
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setScreen('main')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <View style={[styles.methodIconWrap, { backgroundColor:'#DCFCE7' }]}><Text style={{ fontSize:48 }}>💬</Text></View>
          <Text style={styles.screenTitle}>WhatsApp Payment</Text>
          <Text style={styles.screenSub}>+91 {BUSINESS_PHONE}</Text>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`)} activeOpacity={0.85}>
          <View style={[styles.bigBtn, { backgroundColor:'#25D366' }]}>
            <Text style={styles.bigBtnText}>💬  Open WhatsApp</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => recordPayment('whatsapp')} disabled={saving}>
          <Text style={styles.ghostBtnText}>{saving ? 'Saving…' : '✓ I Already Paid on WhatsApp'}</Text>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  // Main screen
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Amount */}
      <LinearGradient colors={['#2563EB','#1D4ED8']} style={styles.amountHero}>
        <View style={styles.amountBlob} />
        <Text style={styles.amountLabel}>Total Amount</Text>
        <Text style={styles.amountValue}>₹{booking.final_price}</Text>
        <Text style={styles.amountSub}>{booking.service?.name} · {booking.worker?.name}</Text>
      </LinearGradient>

      <Text style={styles.chooseLabel}>Choose Payment Method</Text>

      <View style={styles.grid}>
        {METHODS.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.methodCard, { backgroundColor: m.bg, borderColor: m.border }]}
            onPress={() => {
              if (m.key === 'cash')     setScreen('cash')
              else if (m.key === 'whatsapp') setScreen('whatsapp')
              else if (m.key === 'call') Linking.openURL(`tel:${BUSINESS_PHONE}`)
              else Toast.show({ type:'info', text1:'Use website for online payment' })
            }}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize:36, marginBottom:8 }}>{m.emoji}</Text>
            <Text style={[styles.methodLabel, { color: m.text }]}>{m.label}</Text>
            <Text style={styles.methodSub}>{m.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.helpBox}>
        <Text style={styles.helpText}>
          Need help?{' '}
          <Text style={{ color:'#2563EB', fontWeight:'700' }} onPress={() => Linking.openURL(`tel:${BUSINESS_PHONE}`)}>
            Call {BUSINESS_PHONE}
          </Text>
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#F8FAFC' },
  content: { paddingHorizontal:16, paddingTop:56, paddingBottom:40 },
  loading: { flex:1, backgroundColor:'#F8FAFC', alignItems:'center', justifyContent:'center' },

  backBtn:  { marginBottom:20 },
  backText: { color:'#64748B', fontSize:15 },

  amountHero: { borderRadius:22, padding:24, alignItems:'center', marginBottom:24, overflow:'hidden' },
  amountBlob: { position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:60, backgroundColor:'#fff', opacity:0.08 },
  amountLabel:{ color:'rgba(255,255,255,0.8)', fontSize:13, marginBottom:6 },
  amountValue:{ color:'#fff', fontSize:48, fontWeight:'800', marginBottom:6 },
  amountSub:  { color:'rgba(255,255,255,0.7)', fontSize:12 },

  chooseLabel:{ color:'#374151', fontSize:15, fontWeight:'700', textAlign:'center', marginBottom:16 },

  grid:        { flexDirection:'row', flexWrap:'wrap', gap:12, marginBottom:20 },
  methodCard:  { width:'47%', borderRadius:18, borderWidth:1.5, padding:18, alignItems:'center' },
  methodLabel: { fontSize:14, fontWeight:'700', marginBottom:3 },
  methodSub:   { color:'#64748B', fontSize:11, textAlign:'center' },

  helpBox:  { backgroundColor:'#EFF6FF', borderRadius:14, padding:14, borderWidth:1, borderColor:'#BFDBFE' },
  helpText: { color:'#64748B', fontSize:12, textAlign:'center' },

  // Sub-screens
  center:        { alignItems:'center', marginBottom:24 },
  methodIconWrap:{ width:80, height:80, backgroundColor:'#D1FAE5', borderRadius:24, alignItems:'center', justifyContent:'center', marginBottom:14 },
  screenTitle:   { color:'#0F172A', fontSize:22, fontWeight:'800', marginBottom:4 },
  screenSub:     { color:'#64748B', fontSize:13 },

  card:       { backgroundColor:'#fff', borderRadius:18, marginBottom:16, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, overflow:'hidden' },
  detailRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, borderTopWidth:1, borderTopColor:'#F1F5F9' },
  detailKey:  { color:'#64748B', fontSize:13 },
  detailVal:  { color:'#0F172A', fontSize:14, fontWeight:'600' },

  infoBox:  { backgroundColor:'#EFF6FF', borderRadius:14, padding:14, borderWidth:1, borderColor:'#BFDBFE', marginBottom:20 },
  infoText: { color:'#1E40AF', fontSize:13, lineHeight:20 },

  bigBtn:     { borderRadius:16, paddingVertical:17, alignItems:'center', marginBottom:12 },
  bigBtnText: { color:'#fff', fontWeight:'800', fontSize:16 },
  ghostBtn:   { backgroundColor:'#fff', borderRadius:16, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:'#E5E7EB' },
  ghostBtnText:{ color:'#64748B', fontWeight:'600' },

  // Done screen
  doneRoot:    { flex:1, backgroundColor:'#F8FAFC' },
  doneContent: { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
  doneCircle:  { width:96, height:96, borderRadius:28, alignItems:'center', justifyContent:'center', marginBottom:20 },
  doneTitle:   { color:'#0F172A', fontSize:26, fontWeight:'800', marginBottom:6 },
  doneSub:     { color:'#64748B', fontSize:14, marginBottom:28 },
  doneCard:    { backgroundColor:'#fff', borderRadius:18, padding:20, width:'100%', marginBottom:24, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, gap:12 },
  doneRow:     { flexDirection:'row', justifyContent:'space-between' },
  doneKey:     { color:'#64748B', fontSize:13 },
  doneVal:     { color:'#0F172A', fontSize:13, fontWeight:'600' },
  doneBtn:     { borderRadius:16, paddingVertical:16, alignItems:'center', paddingHorizontal:48 },
  doneBtnText: { color:'#fff', fontWeight:'800', fontSize:16 },
})
