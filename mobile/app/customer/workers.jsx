import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Linking, StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { router, useLocalSearchParams } from 'expo-router'
import { fetchNearbyWorkers, fetchServices } from '../../src/store/slices'

function WorkerCard({ worker }) {
  return (
    <View style={[styles.card, worker.is_featured && styles.cardFeatured]}>
      {worker.is_featured && (
        <LinearGradient
          colors={['#2563EB', '#1D4ED8']}
          start={{ x:0, y:0 }} end={{ x:1, y:0 }}
          style={styles.featuredBadge}
        >
          <Text style={styles.featuredText}>👑 Featured Worker</Text>
        </LinearGradient>
      )}

      <View style={styles.cardBody}>
        {/* Avatar */}
        <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.avatar}>
          <Text style={styles.avatarText}>{worker.name?.[0]?.toUpperCase()}</Text>
        </LinearGradient>

        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.workerName}>{worker.name}</Text>
            <View style={[styles.onlineBadge, { backgroundColor: worker.is_available ? '#D1FAE5' : '#F1F5F9' }]}>
              <View style={[styles.onlineDot, { backgroundColor: worker.is_available ? '#10B981' : '#CBD5E1' }]} />
              <Text style={[styles.onlineText, { color: worker.is_available ? '#065F46' : '#64748B' }]}>
                {worker.is_available ? 'Available' : 'Offline'}
              </Text>
            </View>
          </View>
          <Text style={styles.services} numberOfLines={1}>{worker.service_names?.join(' · ')}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>⭐ {worker.avg_rating?.toFixed(1) || 'New'}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.meta}>💼 {worker.total_jobs} jobs</Text>
            {worker.city && <><Text style={styles.metaDot}>·</Text><Text style={styles.meta}>📍 {worker.city}</Text></>}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/customer/book', params: { workerId: worker.id } })}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#2563EB', '#1D4ED8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.bookBtnGrad}>
            <Text style={styles.bookBtnText}>Book Now</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(`tel:${worker.phone}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.callBtnText}>📞 Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function WorkersScreen() {
  const dispatch = useDispatch()
  const params   = useLocalSearchParams()
  const { nearby: workers, isLoading } = useSelector(s => s.workers)
  const { items: services } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)
  const [selected, setSelected] = useState(params.service || '')
  const [search,   setSearch]   = useState('')

  useEffect(() => { dispatch(fetchServices()) }, [])
  useEffect(() => {
    dispatch(fetchNearbyWorkers({ service: selected || undefined, lat: user?.latitude, lng: user?.longitude }))
  }, [selected])

  const filtered = workers.filter(w => !search || w.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Workers</Text>
        <Text style={styles.sub}>{filtered.length} verified professionals</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name…"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Chips */}
      <FlatList
        horizontal
        data={[{ slug:'', name:'All' }, ...services]}
        keyExtractor={i => i.slug}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelected(item.slug)}
            activeOpacity={0.8}
          >
            {selected === item.slug ? (
              <LinearGradient colors={['#2563EB','#1D4ED8']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.chipActive}>
                <Text style={styles.chipActiveText}>{item.name}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{item.name}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <ActivityIndicator color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={w => String(w.id)}
          renderItem={({ item }) => <WorkerCard worker={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No workers found</Text>
              <Text style={styles.emptySub}>Try a different service category</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:'#F8FAFC' },
  header: { paddingHorizontal:16, paddingTop:56, paddingBottom:12 },
  title:  { color:'#0F172A', fontSize:26, fontWeight:'800' },
  sub:    { color:'#64748B', fontSize:13, marginTop:2 },

  searchWrap:  { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', marginHorizontal:16, borderRadius:14, paddingHorizontal:14, marginBottom:12, height:50, borderWidth:1, borderColor:'#E5E7EB', shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  searchIcon:  { fontSize:16, marginRight:8 },
  searchInput: { flex:1, color:'#0F172A', fontSize:14 },

  chips:       { paddingHorizontal:16, gap:8, paddingBottom:12 },
  chipActive:  { paddingHorizontal:16, paddingVertical:8, borderRadius:20 },
  chip:        { paddingHorizontal:16, paddingVertical:8, backgroundColor:'#fff', borderRadius:20, borderWidth:1, borderColor:'#E5E7EB' },
  chipText:    { color:'#64748B', fontSize:13, fontWeight:'500' },
  chipActiveText:{ color:'#fff', fontSize:13, fontWeight:'600' },

  list: { paddingHorizontal:16, paddingBottom:24 },
  card: { backgroundColor:'#fff', borderRadius:20, marginBottom:14, shadowColor:'#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:3, overflow:'hidden' },
  cardFeatured: { borderWidth:2, borderColor:'#2563EB' },
  featuredBadge:{ paddingHorizontal:14, paddingVertical:7, alignSelf:'flex-start' },
  featuredText: { color:'#fff', fontSize:11, fontWeight:'700' },

  cardBody:   { flexDirection:'row', padding:16, gap:14 },
  avatar:     { width:54, height:54, borderRadius:18, alignItems:'center', justifyContent:'center', flexShrink:0 },
  avatarText: { color:'#fff', fontSize:22, fontWeight:'800' },
  cardInfo:   { flex:1 },
  nameRow:    { flexDirection:'row', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' },
  workerName: { color:'#0F172A', fontSize:15, fontWeight:'700' },
  onlineBadge:{ flexDirection:'row', alignItems:'center', gap:4, paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  onlineDot:  { width:6, height:6, borderRadius:3 },
  onlineText: { fontSize:11, fontWeight:'600' },
  services:   { color:'#64748B', fontSize:12, marginBottom:6 },
  metaRow:    { flexDirection:'row', alignItems:'center', gap:4 },
  meta:       { color:'#94A3B8', fontSize:11 },
  metaDot:    { color:'#CBD5E1', fontSize:11 },

  actions:    { flexDirection:'row', gap:10, paddingHorizontal:16, paddingBottom:16 },
  bookBtn:    { flex:1, borderRadius:14, overflow:'hidden' },
  bookBtnGrad:{ paddingVertical:11, alignItems:'center' },
  bookBtnText:{ color:'#fff', fontWeight:'700', fontSize:13 },
  callBtn:    { flex:1, backgroundColor:'#F8FAFC', borderRadius:14, paddingVertical:11, alignItems:'center', borderWidth:1, borderColor:'#E5E7EB' },
  callBtnText:{ color:'#374151', fontSize:13, fontWeight:'600' },

  empty:     { alignItems:'center', paddingTop:60 },
  emptyIcon: { fontSize:48, marginBottom:12 },
  emptyTitle:{ color:'#0F172A', fontSize:16, fontWeight:'700' },
  emptySub:  { color:'#64748B', fontSize:13, marginTop:4 },
})
