import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import { fetchWorkerProfile, fetchServices } from '../../src/store/slices'
import * as ImagePicker from 'expo-image-picker'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'
import { logout } from '../../src/store/authSlice'
import { router } from 'expo-router'

const ID_TYPES = [['aadhaar','Aadhaar'],['pan','PAN'],['voter','Voter ID'],['licence','Licence']]

export default function WorkerProfileScreen() {
  const dispatch = useDispatch()
  const { profile } = useSelector(s => s.workers)
  const { items: services } = useSelector(s => s.services)
  const user = useSelector(s => s.auth.user)
  const [isSaving, setIsSaving] = useState(false)
  const [focused, setFocused] = useState('')
  const [form, setForm] = useState({ bio:'', experience_years:'0', service_radius_km:'10', id_proof_type:'', service_ids:[] })

  useEffect(() => { dispatch(fetchWorkerProfile()); dispatch(fetchServices()) }, [])
  useEffect(() => {
    if (profile) setForm({
      bio:               profile.bio || '',
      experience_years:  String(profile.experience_years || 0),
      service_radius_km: String(profile.service_radius_km || 10),
      id_proof_type:     profile.id_proof_type || '',
      service_ids:       profile.services?.map(s => s.id) || [],
    })
  }, [profile])

  const toggleService = id => setForm(f => ({
    ...f,
    service_ids: f.service_ids.includes(id) ? f.service_ids.filter(s => s !== id) : [...f.service_ids, id],
  }))

  const pickID = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality:0.8 })
    if (!result.canceled) {
      const file = result.assets[0]
      const fd = new FormData()
      fd.append('id_proof_image', { uri:file.uri, type:'image/jpeg', name:'id.jpg' })
      try {
        await api.patch('/workers/profile/', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
        Toast.show({ type:'success', text1:'ID uploaded!' })
      } catch { Toast.show({ type:'error', text1:'Upload failed' }) }
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const fd = new FormData()
      fd.append('bio', form.bio)
      fd.append('experience_years', form.experience_years)
      fd.append('service_radius_km', form.service_radius_km)
      fd.append('id_proof_type', form.id_proof_type)
      form.service_ids.forEach(id => fd.append('service_ids', id))
      await api.patch('/workers/profile/', fd, { headers:{ 'Content-Type':'multipart/form-data' } })
      Toast.show({ type:'success', text1:'Profile updated!' })
      dispatch(fetchWorkerProfile())
    } catch { Toast.show({ type:'error', text1:'Failed to save' }) }
    setIsSaving(false)
  }

  const STATUS_COLOR = { verified:'#00ba7c', pending:'#ffad08', rejected:'#ed4956' }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Banner */}
      <LinearGradient colors={['#1a0533','#2d0a4e','#000']} style={styles.banner}>
        <View style={styles.bannerCircle} />
        <LinearGradient colors={['#833ab4','#c13584','#fd1d1d']} style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </View>
        </LinearGradient>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLOR[profile?.verification_status] || '#ffad08') + '20', borderColor: (STATUS_COLOR[profile?.verification_status] || '#ffad08') + '40' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLOR[profile?.verification_status] || '#ffad08' }]}>
            {profile?.verification_status === 'verified' ? '✅ Verified' : profile?.verification_status === 'rejected' ? '❌ Rejected' : '⏳ Pending Verification'}
          </Text>
        </View>
      </LinearGradient>

      {/* Services */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Services You Offer</Text>
        <View style={styles.chipRow}>
          {services.map(s => (
            <TouchableOpacity
              key={s.id}
              onPress={() => toggleService(s.id)}
              style={{ borderRadius:20, overflow:'hidden' }}
              activeOpacity={0.8}
            >
              {form.service_ids.includes(s.id) ? (
                <LinearGradient colors={['#833ab4','#c13584']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.chip}>
                  <Text style={styles.chipTextActive}>{s.name}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.chipInactive}>
                  <Text style={styles.chipText}>{s.name}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About You</Text>
        {[
          { key:'bio',               label:'Bio',                placeholder:'Describe your experience…',   multiline:true  },
          { key:'experience_years',  label:'Years of Experience', placeholder:'5',                           multiline:false },
          { key:'service_radius_km', label:'Service Radius (km)', placeholder:'10',                          multiline:false },
        ].map(f => (
          <View key={f.key} style={{ marginBottom:14 }}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={[styles.input, f.multiline && { minHeight:80 }, focused === f.key && styles.inputFocused]}
              placeholder={f.placeholder}
              placeholderTextColor="#737373"
              multiline={f.multiline}
              textAlignVertical={f.multiline ? 'top' : 'center'}
              keyboardType={f.multiline ? 'default' : 'number-pad'}
              value={form[f.key]}
              onChangeText={v => setForm({ ...form, [f.key]: v })}
              onFocus={() => setFocused(f.key)}
              onBlur={() => setFocused('')}
            />
          </View>
        ))}
      </View>

      {/* ID Proof */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ID Verification</Text>
        <View style={styles.chipRow}>
          {ID_TYPES.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => setForm({ ...form, id_proof_type: key })}
              style={{ borderRadius:14, overflow:'hidden' }}
              activeOpacity={0.8}
            >
              {form.id_proof_type === key ? (
                <LinearGradient colors={['#833ab4','#c13584']} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.chip}>
                  <Text style={styles.chipTextActive}>{label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.chipInactive}>
                  <Text style={styles.chipText}>{label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickID}>
          <Text style={styles.uploadText}>
            {profile?.id_proof_image ? '✅ ID Uploaded — Tap to change' : '📷  Upload ID Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isSaving}
        style={{ borderRadius:18, overflow:'hidden', marginBottom:12 }}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isSaving ? ['#333','#222'] : ['#833ab4','#c13584','#fd1d1d']}
          start={{ x:0,y:0 }} end={{ x:1,y:0 }}
          style={styles.saveBtn}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾  Save Profile</Text>}
        </LinearGradient>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => { dispatch(logout()); router.replace('/auth/login') }}
      >
        <Text style={styles.logoutText}>🚪  Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#000' },
  content: { paddingBottom:40 },

  banner:       { paddingTop:56, paddingBottom:28, alignItems:'center', overflow:'hidden' },
  bannerCircle: { position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:100, backgroundColor:'#833ab4', opacity:0.15 },
  avatarRing:   { width:88, height:88, borderRadius:28, alignItems:'center', justifyContent:'center', padding:3, marginBottom:12 },
  avatarInner:  { width:'100%', height:'100%', borderRadius:26, backgroundColor:'#121212', alignItems:'center', justifyContent:'center' },
  avatarText:   { color:'#fff', fontSize:34, fontWeight:'800' },
  userName:     { color:'#fff', fontSize:20, fontWeight:'800', marginBottom:3 },
  userPhone:    { color:'#a8a8a8', fontSize:13, marginBottom:10 },
  statusBadge:  { borderRadius:20, paddingHorizontal:14, paddingVertical:5, borderWidth:1 },
  statusText:   { fontSize:12, fontWeight:'600' },

  card:      { backgroundColor:'#121212', borderRadius:22, marginHorizontal:16, marginBottom:14, padding:20, borderWidth:1, borderColor:'#262626' },
  cardTitle: { color:'#fff', fontSize:15, fontWeight:'700', marginBottom:14 },

  chipRow: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:    { paddingHorizontal:14, paddingVertical:7, borderRadius:20 },
  chipInactive: { paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:'#1a1a1a', borderWidth:1, borderColor:'#262626' },
  chipText:       { color:'#737373', fontSize:12, fontWeight:'500' },
  chipTextActive: { color:'#fff', fontSize:12, fontWeight:'600' },

  label:       { color:'#a8a8a8', fontSize:12, fontWeight:'600', marginBottom:7 },
  input:       { backgroundColor:'#1a1a1a', borderRadius:14, paddingHorizontal:16, paddingVertical:13, color:'#fff', fontSize:14, borderWidth:1, borderColor:'#262626' },
  inputFocused:{ borderColor:'#c13584', borderWidth:1.5 },

  uploadBtn:  { backgroundColor:'#1a1a1a', borderRadius:14, paddingVertical:14, alignItems:'center', marginTop:12, borderWidth:1, borderColor:'#262626', borderStyle:'dashed' },
  uploadText: { color:'#a8a8a8', fontSize:13 },

  saveBtn:     { paddingVertical:16, alignItems:'center', borderRadius:18 },
  saveBtnText: { color:'#fff', fontWeight:'800', fontSize:16 },
  logoutBtn:   { marginHorizontal:16, backgroundColor:'#1a0000', borderRadius:16, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:'#ed4956' + '30' },
  logoutText:  { color:'#ed4956', fontWeight:'700', fontSize:14 },
})
