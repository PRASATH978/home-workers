import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  Linking, RefreshControl, TextInput, Alert, StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { format } from 'date-fns'
import * as Clipboard from 'expo-clipboard'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'

const STATUS_COLOR = { pending:'#F59E0B', accepted:'#3B82F6', in_progress:'#3B82F6', completed:'#10B981', cancelled:'#EF4444', rejected:'#EF4444' }
const STATUS_BG    = { pending:'#FEF3C7', accepted:'#DBEAFE', in_progress:'#DBEAFE', completed:'#D1FAE5', cancelled:'#FEE2E2', rejected:'#FEE2E2' }
const STATUS_LABEL = { pending:'⏳ Pending', accepted:'✅ Accepted', in_progress:'🔧 In Progress', completed:'✔️ Completed', cancelled:'❌ Cancelled', rejected:'❌ Rejected' }

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams()
  const [booking,    setBooking]    = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [rating,     setRating]     = useState(5)
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [focused,    setFocused]    = useState('')

  const load = async () => {
    try { const res = await api.get(`/bookings/${id}/`); setBooking(res.data) }
    catch { Toast.show({ type:'error', text1:'Failed to load' }) }
  }
  useEffect(() => { load() }, [id])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const copyOtp = async () => {
    await Clipboard.setStringAsync(booking.completion_otp)
    Toast.show({ type:'success', text1:'OTP copied!' })
  }

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text:'No', style:'cancel' },
      { text:'Cancel', style:'destructive', onPress: async () => {
        try { await api.delete(`/bookings/${id}/`); Toast.show({ type:'success', text1:'Cancelled' }); router.back() }
        catch { Toast.show({ type:'error', text1:'Cannot cancel' }) }
      }}
    ])
  }

  const handleReview = async () => {
    setSubmitting(true)
    try {
      await api.post(`/bookings/${id}/review/`, { rating, comment })
      Toast.show({ type:'success', text1:'Review submitted!' })
      setBooking(b => ({ ...b, has_review: true }))
    } catch { Toast.show({ type:'error', text1:'Failed' }) }
    setSubmitting(false)
  }

  if (!booking) return (
    <View style={styles.loading}><Text style={{ color:'#64748B' }}>Loading…</Text></View>
  )

  const statusColor = STATUS_COLOR[booking.status] || '#64748B'
  const statusBg    = STATUS_BG[booking.status]    || '#F1F5F9'
  const needsPayment = booking.status === 'completed' && booking.payment_status === 'unpaid'

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={styles.title}>Booking #{booking.id}</Text>
          <Text style={styles.sub}>{booking.service?.name}</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Status card */}
      <View style={styles.card}>
        <LinearGradient colors={['#2563EB','#1D4ED8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.cardBar} />
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{STATUS_LABEL[booking.status]}</Text>
          </View>
          {booking.final_price && <Text style={styles.price}>₹{booking.final_price}</Text>}
        </View>
        {[
          ['Service',   booking.service?.name],
          ['Booked',    format(new Date(booking.created_at), 'dd MMM yyyy, hh:mm a')],
          booking.accepted_at  && ['Accepted',  format(new Date(booking.accepted_at),  'dd MMM, hh:mm a')],
          booking.started_at   && ['Started',   format(new Date(booking.started_at),   'dd MMM, hh:mm a')],
          booking.completed_at && ['Completed', format(new Date(booking.completed_at), 'dd MMM, hh:mm a')],
        ].filter(Boolean).map(([k, v]) => (
          <View key={k} style={styles.detailRow}>
            <Text style={styles.detailKey}>{k}</Text>
            <Text style={styles.detailVal}>{v}</Text>
          </View>
        ))}
      </View>

      {/* OTP Box */}
      {booking.status === 'in_progress' && booking.completion_otp && (
        <View style={styles.otpCard}>
          <LinearGradient colors={['#2563EB','#1D4ED8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.otpHeader}>
            <Text style={styles.otpHeaderText}>🔐 Share OTP with Worker</Text>
          </LinearGradient>
          <View style={styles.otpBody}>
            <Text style={styles.otpSub}>Worker needs this to complete the job</Text>
            <View style={styles.otpRow}>
              <View style={styles.otpBox}>
                <Text style={styles.otpCode}>{booking.completion_otp}</Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={copyOtp}>
                <Text style={styles.copyText}>📋{'\n'}Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Problem + Address */}
      <View style={styles.card}>
        <Text style={styles.infoLabel}>📝 Problem Description</Text>
        <Text style={styles.infoValue}>{booking.problem_description}</Text>
        <View style={styles.infoDivider} />
        <Text style={styles.infoLabel}>📍 Service Address</Text>
        <Text style={styles.infoValue}>{booking.address}</Text>
      </View>

      {/* Worker */}
      {booking.worker && (
        <View style={[styles.card, styles.workerCard]}>
          <LinearGradient colors={['#2563EB','#1D4ED8']} style={styles.workerAvatar}>
            <Text style={styles.workerAvatarText}>{booking.worker.name?.[0]?.toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex:1 }}>
            <Text style={styles.workerName}>{booking.worker.name}</Text>
            <Text style={styles.workerCity}>{booking.worker.city || 'Verified Worker'}</Text>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${booking.worker.phone}`)}>
            <Text style={styles.callText}>📞 Call</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pay Now */}
      {needsPayment && (
        <View style={styles.payCard}>
          <View style={styles.payTop}>
            <Text style={styles.payTitle}>💳 Payment Required</Text>
            <Text style={styles.payAmount}>₹{booking.final_price}</Text>
          </View>
          <Text style={styles.paySub}>Cash, UPI, WhatsApp or Card</Text>
          <TouchableOpacity onPress={() => router.push({ pathname:'/customer/payment', params:{ bookingId: id } })} activeOpacity={0.85}>
            <LinearGradient colors={['#2563EB','#1D4ED8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.payBtn}>
              <Text style={styles.payBtnText}>Pay Now →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {booking.payment_status === 'pending' && (
        <View style={[styles.card, { backgroundColor:'#FEF3C7', borderWidth:1, borderColor:'#FDE68A' }]}>
          <Text style={{ color:'#92400E', fontWeight:'600', textAlign:'center' }}>⏳ Payment Pending Verification</Text>
          <Text style={{ color:'#B45309', fontSize:12, textAlign:'center', marginTop:4 }}>Admin will verify within 30 minutes</Text>
        </View>
      )}

      {booking.payment_status === 'paid' && (
        <View style={[styles.card, { backgroundColor:'#D1FAE5', borderWidth:1, borderColor:'#A7F3D0' }]}>
          <Text style={{ color:'#065F46', fontWeight:'700', textAlign:'center', fontSize:15 }}>✅ Payment Complete</Text>
        </View>
      )}

      {/* Review */}
      {booking.status === 'completed' && !booking.has_review && (
        <View style={styles.card}>
          <Text style={styles.reviewTitle}>⭐ Rate Your Experience</Text>
          <View style={styles.starsRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={{ fontSize:34 }}>{n <= rating ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.reviewInput, focused === 'review' && styles.inputFocused]}
            placeholder="Tell us how it went…"
            placeholderTextColor="#94A3B8"
            multiline numberOfLines={3}
            textAlignVertical="top"
            value={comment}
            onChangeText={setComment}
            onFocus={() => setFocused('review')}
            onBlur={() => setFocused('')}
          />
          <TouchableOpacity onPress={handleReview} disabled={submitting} activeOpacity={0.85}>
            <LinearGradient colors={submitting ? ['#94A3B8','#64748B'] : ['#2563EB','#1D4ED8']} style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>{submitting ? 'Submitting…' : 'Submit Review'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {booking.has_review && (
        <View style={[styles.card, { backgroundColor:'#D1FAE5', borderWidth:1, borderColor:'#A7F3D0' }]}>
          <Text style={{ color:'#065F46', fontWeight:'600', textAlign:'center' }}>⭐ Review Submitted — Thank you!</Text>
        </View>
      )}

      {booking.status === 'pending' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#F8FAFC' },
  content: { paddingHorizontal:16, paddingTop:56, paddingBottom:40 },
  loading: { flex:1, backgroundColor:'#F8FAFC', alignItems:'center', justifyContent:'center' },

  header:   { flexDirection:'row', alignItems:'center', gap:12, marginBottom:16 },
  backBtn:  { width:40, height:40, backgroundColor:'#fff', borderRadius:12, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#E5E7EB', shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  backText: { color:'#0F172A', fontSize:18, fontWeight:'600' },
  title:    { color:'#0F172A', fontSize:20, fontWeight:'800' },
  sub:      { color:'#64748B', fontSize:12, marginTop:1 },
  liveBadge:{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#D1FAE5', borderRadius:20, paddingHorizontal:10, paddingVertical:5 },
  liveDot:  { width:7, height:7, borderRadius:4, backgroundColor:'#10B981' },
  liveText: { color:'#065F46', fontSize:11, fontWeight:'600' },

  card:       { backgroundColor:'#fff', borderRadius:18, marginBottom:12, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, overflow:'hidden' },
  cardBar:    { height:4 },
  statusRow:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14, paddingBottom:8 },
  statusBadge:{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  statusDot:  { width:7, height:7, borderRadius:4 },
  statusLabel:{ fontSize:13, fontWeight:'700' },
  price:      { fontSize:22, fontWeight:'800', color:'#0F172A' },
  detailRow:  { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:14, paddingVertical:8, borderTopWidth:1, borderTopColor:'#F1F5F9' },
  detailKey:  { color:'#64748B', fontSize:13 },
  detailVal:  { color:'#0F172A', fontSize:13, fontWeight:'500' },

  otpCard:   { backgroundColor:'#fff', borderRadius:18, marginBottom:12, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, overflow:'hidden', borderWidth:2, borderColor:'#BFDBFE' },
  otpHeader: { paddingHorizontal:16, paddingVertical:10 },
  otpHeaderText:{ color:'#fff', fontWeight:'700', fontSize:14 },
  otpBody:   { padding:16 },
  otpSub:    { color:'#64748B', fontSize:12, marginBottom:12 },
  otpRow:    { flexDirection:'row', gap:12 },
  otpBox:    { flex:1, backgroundColor:'#EFF6FF', borderRadius:14, borderWidth:2, borderColor:'#2563EB', paddingVertical:18, alignItems:'center' },
  otpCode:   { color:'#1D4ED8', fontSize:36, fontWeight:'800', letterSpacing:8 },
  copyBtn:   { backgroundColor:'#F8FAFC', borderRadius:14, width:60, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#E5E7EB' },
  copyText:  { color:'#64748B', fontSize:11, textAlign:'center', lineHeight:16 },

  infoLabel:   { color:'#64748B', fontSize:12, fontWeight:'600', paddingHorizontal:14, paddingTop:14 },
  infoValue:   { color:'#0F172A', fontSize:14, lineHeight:20, paddingHorizontal:14, paddingBottom:14, paddingTop:4 },
  infoDivider: { height:1, backgroundColor:'#F1F5F9' },

  workerCard:  { flexDirection:'row', alignItems:'center', gap:14, padding:16 },
  workerAvatar:{ width:48, height:48, borderRadius:16, alignItems:'center', justifyContent:'center' },
  workerAvatarText:{ color:'#fff', fontSize:20, fontWeight:'800' },
  workerName:  { color:'#0F172A', fontSize:15, fontWeight:'700' },
  workerCity:  { color:'#64748B', fontSize:12, marginTop:2 },
  callBtn:     { backgroundColor:'#EFF6FF', borderRadius:12, paddingHorizontal:14, paddingVertical:9 },
  callText:    { color:'#2563EB', fontSize:13, fontWeight:'600' },

  payCard:   { backgroundColor:'#EFF6FF', borderRadius:18, padding:18, marginBottom:12, borderWidth:1, borderColor:'#BFDBFE' },
  payTop:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  payTitle:  { color:'#0F172A', fontSize:15, fontWeight:'700' },
  payAmount: { color:'#1D4ED8', fontSize:22, fontWeight:'800' },
  paySub:    { color:'#64748B', fontSize:12, marginBottom:14 },
  payBtn:    { borderRadius:14, paddingVertical:14, alignItems:'center' },
  payBtnText:{ color:'#fff', fontWeight:'700', fontSize:15 },

  reviewTitle:  { color:'#0F172A', fontSize:16, fontWeight:'700', padding:14, paddingBottom:8 },
  starsRow:     { flexDirection:'row', gap:8, paddingHorizontal:14, paddingBottom:12, justifyContent:'center' },
  reviewInput:  { backgroundColor:'#F8FAFC', borderRadius:14, padding:14, color:'#0F172A', fontSize:14, minHeight:80, marginHorizontal:14, borderWidth:1, borderColor:'#E5E7EB', marginBottom:14 },
  inputFocused: { borderColor:'#2563EB', borderWidth:2 },
  reviewBtn:    { borderRadius:14, paddingVertical:14, alignItems:'center', marginHorizontal:14, marginBottom:14 },
  reviewBtnText:{ color:'#fff', fontWeight:'700', fontSize:15 },

  cancelBtn: { borderWidth:1, borderColor:'#FECACA', backgroundColor:'#FEE2E2', borderRadius:16, paddingVertical:14, alignItems:'center' },
  cancelText:{ color:'#DC2626', fontWeight:'600', fontSize:14 },
})
