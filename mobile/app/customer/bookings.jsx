import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { fetchMyBookings } from '../../src/store/slices'
import { format } from 'date-fns'

const STATUS = {
  pending:     { bg:'#FEF3C7', text:'#92400E', dot:'#F59E0B', label:'⏳ Pending'     },
  accepted:    { bg:'#DBEAFE', text:'#1E40AF', dot:'#3B82F6', label:'✅ Accepted'    },
  in_progress: { bg:'#DBEAFE', text:'#1E40AF', dot:'#3B82F6', label:'🔧 In Progress' },
  completed:   { bg:'#D1FAE5', text:'#065F46', dot:'#10B981', label:'✔️ Completed'   },
  cancelled:   { bg:'#FEE2E2', text:'#991B1B', dot:'#EF4444', label:'❌ Cancelled'   },
  rejected:    { bg:'#FEE2E2', text:'#991B1B', dot:'#EF4444', label:'❌ Rejected'    },
}

function BookingCard({ item }) {
  const s = STATUS[item.status] || STATUS.pending
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname:'/customer/booking-detail', params:{ id: item.id } })}
      activeOpacity={0.75}
    >
      {/* Top color bar */}
      <LinearGradient colors={['#2563EB','#1D4ED8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.cardBar} />

      <View style={styles.cardBody}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardService}>{item.service?.name}</Text>
          <Text style={styles.cardDesc} numberOfLines={1}>{item.problem_description}</Text>
          <Text style={styles.cardDate}>📅 {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}</Text>

          {item.status === 'completed' && item.payment_status === 'unpaid' && (
            <View style={styles.payBadge}>
              <Text style={styles.payBadgeText}>💳 Tap to Pay</Text>
            </View>
          )}
          {item.payment_status === 'paid' && (
            <View style={[styles.payBadge, { backgroundColor:'#D1FAE5' }]}>
              <Text style={[styles.payBadgeText, { color:'#065F46' }]}>✅ Paid</Text>
            </View>
          )}
        </View>

        <View style={styles.cardRight}>
          <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: s.dot }]} />
            <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
          </View>
          {item.final_price && (
            <Text style={styles.price}>₹{item.final_price}</Text>
          )}
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function BookingsScreen() {
  const dispatch = useDispatch()
  const { myBookings, isLoading } = useSelector(s => s.bookings)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => dispatch(fetchMyBookings())
  useEffect(() => { load() }, [])
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Bookings</Text>
          <Text style={styles.sub}>{myBookings.length} total bookings</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/customer/book')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#2563EB','#1D4ED8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.newBtn}>
            <Text style={styles.newBtnText}>+ New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop:40 }} />
      ) : (
        <FlatList
          data={myBookings}
          keyExtractor={b => String(b.id)}
          renderItem={({ item }) => <BookingCard item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Text style={{ fontSize:40 }}>📋</Text>
              </View>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptySub}>Book your first service today</Text>
              <TouchableOpacity onPress={() => router.push('/customer')} activeOpacity={0.85}>
                <LinearGradient colors={['#2563EB','#1D4ED8']} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Browse Services</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:'#F8FAFC' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingTop:56, paddingBottom:16 },
  title:  { color:'#0F172A', fontSize:26, fontWeight:'800' },
  sub:    { color:'#64748B', fontSize:13, marginTop:2 },
  newBtn: { paddingHorizontal:18, paddingVertical:10, borderRadius:14 },
  newBtnText: { color:'#fff', fontWeight:'700', fontSize:14 },

  list: { paddingHorizontal:16, paddingBottom:24 },
  card: { backgroundColor:'#fff', borderRadius:18, marginBottom:12, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, overflow:'hidden' },
  cardBar:   { height:4 },
  cardBody:  { flexDirection:'row', padding:14, gap:10 },
  cardLeft:  { flex:1 },
  cardService:{ color:'#0F172A', fontSize:15, fontWeight:'700', marginBottom:3 },
  cardDesc:  { color:'#64748B', fontSize:12, marginBottom:5 },
  cardDate:  { color:'#94A3B8', fontSize:11 },
  payBadge:  { backgroundColor:'#FEF3C7', borderRadius:8, paddingHorizontal:8, paddingVertical:3, alignSelf:'flex-start', marginTop:6 },
  payBadgeText:{ color:'#92400E', fontSize:11, fontWeight:'600' },

  cardRight:   { alignItems:'flex-end', justifyContent:'space-between' },
  statusBadge: { flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:4, borderRadius:20 },
  statusDot:   { width:6, height:6, borderRadius:3 },
  statusText:  { fontSize:10, fontWeight:'600' },
  price:       { color:'#059669', fontWeight:'700', fontSize:15 },
  arrow:       { color:'#CBD5E1', fontSize:20 },

  empty:       { alignItems:'center', paddingTop:60 },
  emptyIconWrap:{ width:80, height:80, backgroundColor:'#EFF6FF', borderRadius:24, alignItems:'center', justifyContent:'center', marginBottom:16 },
  emptyTitle:  { color:'#0F172A', fontSize:18, fontWeight:'700' },
  emptySub:    { color:'#64748B', fontSize:13, marginTop:4, marginBottom:20 },
  emptyBtn:    { paddingHorizontal:28, paddingVertical:13, borderRadius:14 },
  emptyBtnText:{ color:'#fff', fontWeight:'700', fontSize:14 },
})
