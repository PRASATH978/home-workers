import React from 'react'
import {
  View, Text, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { logout } from '../../src/store/authSlice'

export default function CustomerProfileScreen() {
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)
  const handleLogout = () => { dispatch(logout()); router.replace('/auth/login') }

  const infoRows = [
    { icon:'📱', label:'Phone',    value: user?.phone },
    { icon:'📧', label:'Email',    value: user?.email || 'Not set' },
    { icon:'📍', label:'City',     value: user?.city  || 'Not set' },
    { icon:'✅', label:'Verified', value: user?.is_phone_verified ? 'Yes' : 'No' },
  ]

  const menuItems = [
    { icon:'📋', label:'My Bookings',  sub:'View all your bookings',    onPress: () => router.push('/customer/bookings') },
    { icon:'👷', label:'Find Workers', sub:'Browse available workers',  onPress: () => router.push('/customer/workers')  },
    { icon:'🏠', label:'Home',         sub:'Browse all services',       onPress: () => router.push('/customer')          },
  ]

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Banner */}
      <LinearGradient colors={['#2563EB','#1D4ED8']} style={styles.banner}>
        <View style={styles.bannerBlob1} />
        <View style={styles.bannerBlob2} />
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>🙋 Customer Account</Text>
        </View>
      </LinearGradient>

      {/* Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Details</Text>
        {infoRows.map((row, i) => (
          <View key={row.label} style={[styles.row, i < infoRows.length - 1 && styles.rowBorder]}>
            <View style={styles.rowIcon}><Text style={{ fontSize:16 }}>{row.icon}</Text></View>
            <View style={{ flex:1 }}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, i < menuItems.length - 1 && styles.rowBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconWrap}>
              <Text style={{ fontSize:20 }}>{item.icon}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} activeOpacity={0.85} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>🚪  Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>LocalService Connect • Krishnagiri, Tamil Nadu</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#F8FAFC' },
  content: { paddingBottom:40 },

  banner:      { paddingTop:60, paddingBottom:32, alignItems:'center', paddingHorizontal:24, overflow:'hidden' },
  bannerBlob1: { position:'absolute', top:-60, right:-60, width:180, height:180, borderRadius:90, backgroundColor:'#fff', opacity:0.06 },
  bannerBlob2: { position:'absolute', bottom:-40, left:-40, width:140, height:140, borderRadius:70, backgroundColor:'#fff', opacity:0.04 },
  avatarWrap:  { width:88, height:88, borderRadius:28, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center', marginBottom:14, borderWidth:3, borderColor:'rgba(255,255,255,0.4)' },
  avatarText:  { color:'#fff', fontSize:36, fontWeight:'800' },
  userName:    { color:'#fff', fontSize:22, fontWeight:'800', marginBottom:4 },
  userPhone:   { color:'rgba(255,255,255,0.8)', fontSize:14, marginBottom:12 },
  roleBadge:   { backgroundColor:'rgba(255,255,255,0.15)', borderRadius:20, paddingHorizontal:14, paddingVertical:5, borderWidth:1, borderColor:'rgba(255,255,255,0.3)' },
  roleBadgeText:{ color:'#fff', fontSize:12, fontWeight:'600' },

  card:      { backgroundColor:'#fff', borderRadius:20, marginHorizontal:16, marginBottom:14, padding:20, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3 },
  cardTitle: { color:'#0F172A', fontSize:15, fontWeight:'700', marginBottom:16 },

  row:       { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:12 },
  rowBorder: { borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  rowIcon:   { width:36, height:36, backgroundColor:'#EFF6FF', borderRadius:10, alignItems:'center', justifyContent:'center' },
  rowLabel:  { color:'#64748B', fontSize:11, fontWeight:'500' },
  rowValue:  { color:'#0F172A', fontSize:14, fontWeight:'600', marginTop:1 },

  menuItem:    { flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14 },
  menuIconWrap:{ width:40, height:40, backgroundColor:'#EFF6FF', borderRadius:12, alignItems:'center', justifyContent:'center' },
  menuLabel:   { color:'#0F172A', fontSize:14, fontWeight:'600' },
  menuSub:     { color:'#64748B', fontSize:12, marginTop:1 },
  menuArrow:   { color:'#CBD5E1', fontSize:22 },

  logoutBtn:  { marginHorizontal:16, backgroundColor:'#FEE2E2', borderRadius:16, paddingVertical:15, alignItems:'center', borderWidth:1, borderColor:'#FECACA' },
  logoutText: { color:'#DC2626', fontWeight:'700', fontSize:15 },
  footer:     { textAlign:'center', color:'#94A3B8', fontSize:12, marginTop:24 },
})
