import React, { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { createBooking, fetchMyBookings, fetchServices } from '../../src/store/slices'
import Toast from 'react-native-toast-message'

export default function BookScreen() {
  const dispatch = useDispatch()
  const { items: services } = useSelector(s => s.services)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [focused,      setFocused]      = useState('')
  const [form, setForm] = useState({
    service: null, serviceName: '',
    problem_description: '', address: '',
  })

  useEffect(() => { dispatch(fetchServices()) }, [])

  const handleSubmit = async () => {
    if (!form.service)                    return Toast.show({ type:'error', text1:'Select a service' })
    if (!form.problem_description.trim()) return Toast.show({ type:'error', text1:'Describe your problem' })
    if (!form.address.trim())             return Toast.show({ type:'error', text1:'Enter your address' })
    setIsSubmitting(true)
    const res = await dispatch(createBooking({
      service: form.service,
      problem_description: form.problem_description,
      address: form.address,
    }))
    if (res.meta.requestStatus === 'fulfilled') {
      await dispatch(fetchMyBookings())
      Toast.show({ type:'success', text1:'✅ Booking created!', text2:'Workers will be notified' })
      router.replace('/customer/bookings')
    } else {
      Toast.show({ type:'error', text1:'Failed to create booking' })
    }
    setIsSubmitting(false)
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Book a Service</Text>
            <Text style={styles.sub}>Fill in the details below</Text>
          </View>
        </View>

        {/* Form card */}
        <View style={styles.card}>

          {/* Service picker */}
          <Text style={styles.label}>Service Type *</Text>
          <TouchableOpacity
            style={[styles.picker, menuOpen && styles.pickerOpen]}
            onPress={() => setMenuOpen(!menuOpen)}
            activeOpacity={0.8}
          >
            <Text style={form.service ? styles.pickerSelected : styles.pickerPlaceholder}>
              {form.serviceName || 'Select a service…'}
            </Text>
            <Text style={styles.pickerArrow}>{menuOpen ? '▴' : '▾'}</Text>
          </TouchableOpacity>

          {menuOpen && (
            <View style={styles.dropdown}>
              {services.map((s, i) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.dropdownItem, i < services.length - 1 && styles.dropdownDivider]}
                  onPress={() => {
                    setForm({ ...form, service: s.id, serviceName: `${s.name} – from ₹${s.base_price}` })
                    setMenuOpen(false)
                  }}
                >
                  <Text style={styles.dropdownName}>{s.name}</Text>
                  <Text style={styles.dropdownPrice}>₹{s.base_price}+</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Problem */}
          <Text style={[styles.label, { marginTop:16 }]}>Problem Description *</Text>
          <TextInput
            style={[styles.textArea, focused === 'prob' && styles.inputFocused]}
            placeholder={"Describe your problem…\ne.g. Bathroom tap is leaking"}
            placeholderTextColor="#94A3B8"
            multiline numberOfLines={4}
            textAlignVertical="top"
            value={form.problem_description}
            onChangeText={v => setForm({ ...form, problem_description: v })}
            onFocus={() => setFocused('prob')}
            onBlur={() => setFocused('')}
          />

          {/* Address */}
          <Text style={[styles.label, { marginTop:16 }]}>Service Address *</Text>
          <TextInput
            style={[styles.textArea, { minHeight:70 }, focused === 'addr' && styles.inputFocused]}
            placeholder="No. 12, Gandhi Nagar, Krishnagiri – 635001"
            placeholderTextColor="#94A3B8"
            multiline numberOfLines={2}
            textAlignVertical="top"
            value={form.address}
            onChangeText={v => setForm({ ...form, address: v })}
            onFocus={() => setFocused('addr')}
            onBlur={() => setFocused('')}
          />

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
            style={{ marginTop:24 }}
          >
            <LinearGradient
              colors={isSubmitting ? ['#94A3B8','#64748B'] : ['#2563EB','#1D4ED8']}
              style={styles.submitBtn}
            >
              {isSubmitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>✅  Confirm Booking</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            💡 Nearby verified workers will be notified and one will accept your request shortly.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root:   { flex:1, backgroundColor:'#F8FAFC' },
  scroll: { paddingHorizontal:16, paddingTop:56, paddingBottom:32 },

  header:   { flexDirection:'row', alignItems:'center', gap:14, marginBottom:24 },
  backBtn:  { width:40, height:40, backgroundColor:'#fff', borderRadius:12, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#E5E7EB', shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:4, elevation:2 },
  backText: { color:'#0F172A', fontSize:18, fontWeight:'600' },
  title:    { color:'#0F172A', fontSize:22, fontWeight:'800' },
  sub:      { color:'#64748B', fontSize:13, marginTop:2 },

  card:  { backgroundColor:'#fff', borderRadius:24, padding:20, shadowColor:'#000', shadowOffset:{width:0,height:5}, shadowOpacity:0.08, shadowRadius:15, elevation:8 },
  label: { color:'#374151', fontSize:13, fontWeight:'600', marginBottom:8 },

  picker:           { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#F8FAFC', borderRadius:14, paddingHorizontal:16, height:52, borderWidth:1, borderColor:'#E5E7EB' },
  pickerOpen:       { borderColor:'#2563EB', borderWidth:2 },
  pickerPlaceholder:{ color:'#94A3B8', fontSize:14 },
  pickerSelected:   { color:'#0F172A', fontSize:14 },
  pickerArrow:      { color:'#94A3B8', fontSize:14 },

  dropdown:       { backgroundColor:'#fff', borderRadius:14, marginTop:4, borderWidth:1, borderColor:'#E5E7EB', overflow:'hidden', shadowColor:'#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.1, shadowRadius:8, elevation:5 },
  dropdownItem:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:16, paddingVertical:14 },
  dropdownDivider:{ borderBottomWidth:1, borderBottomColor:'#F1F5F9' },
  dropdownName:   { color:'#0F172A', fontSize:14 },
  dropdownPrice:  { color:'#2563EB', fontSize:13, fontWeight:'600' },

  textArea:     { backgroundColor:'#F8FAFC', borderRadius:14, paddingHorizontal:16, paddingVertical:14, color:'#0F172A', fontSize:14, minHeight:100, borderWidth:1, borderColor:'#E5E7EB' },
  inputFocused: { borderColor:'#2563EB', borderWidth:2 },

  submitBtn:  { borderRadius:14, paddingVertical:16, alignItems:'center' },
  submitText: { color:'#fff', fontWeight:'700', fontSize:16 },

  note:     { backgroundColor:'#EFF6FF', borderRadius:14, padding:14, marginTop:16, borderWidth:1, borderColor:'#BFDBFE' },
  noteText: { color:'#1D4ED8', fontSize:12, lineHeight:18 },
})
