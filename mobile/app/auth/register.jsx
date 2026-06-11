import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native'
import { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import { register } from '../../src/store/authSlice'
import Toast from 'react-native-toast-message'

export default function RegisterScreen() {
  const dispatch = useDispatch()
  const { isLoading } = useSelector(s => s.auth)
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'customer' })
  const [focused, setFocused] = useState('')

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password)
      return Toast.show({ type: 'error', text1: 'Fill in all fields' })
    if (form.password.length < 6)
      return Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' })
    const res = await dispatch(register(form))
    if (res.meta.requestStatus === 'fulfilled') {
      Toast.show({ type: 'success', text1: 'Account created!' })
      router.replace(form.role === 'worker' ? '/worker' : '/customer')
    } else {
      const err = res.payload
      Toast.show({ type: 'error', text1: err?.phone?.[0] || 'Registration failed' })
    }
  }

  const fields = [
    { key: 'name',     icon: '👤', placeholder: 'Full Name',    secure: false, keyboard: 'default'   },
    { key: 'phone',    icon: '📱', placeholder: 'Phone Number', secure: false, keyboard: 'phone-pad' },
    { key: 'password', icon: '🔒', placeholder: 'Password',     secure: true,  keyboard: 'default'   },
  ]

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Back + Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <LinearGradient
            colors={['#833ab4', '#fd1d1d', '#fcb045']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.logoGrad}
          >
            <Text style={{ fontSize: 28 }}>🔧</Text>
          </LinearGradient>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>Join LocalService today</Text>
        </View>

        <View style={styles.card}>
          {/* Role selector */}
          <Text style={styles.label}>I am a…</Text>
          <View style={styles.roleRow}>
            {[
              { key: 'customer', emoji: '🙋', label: 'Customer' },
              { key: 'worker',   emoji: '🔧', label: 'Worker'   },
            ].map(r => (
              <TouchableOpacity
                key={r.key}
                onPress={() => setForm({ ...form, role: r.key })}
                activeOpacity={0.8}
                style={[styles.roleBtn, form.role === r.key && styles.roleBtnActive]}
              >
                {form.role === r.key ? (
                  <LinearGradient
                    colors={['#833ab4', '#c13584']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.roleBtnGrad}
                  >
                    <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                    <Text style={styles.roleLabelActive}>{r.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.roleBtnInner}>
                    <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                    <Text style={styles.roleLabel}>{r.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Fields */}
          {fields.map(f => (
            <View key={f.key} style={[styles.inputWrap, focused === f.key && styles.inputFocused]}>
              <Text style={styles.inputIcon}>{f.icon}</Text>
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor="#737373"
                secureTextEntry={f.secure}
                keyboardType={f.keyboard}
                value={form[f.key]}
                onChangeText={v => setForm({ ...form, [f.key]: v })}
                onFocus={() => setFocused(f.key)}
                onBlur={() => setFocused('')}
              />
            </View>
          ))}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.85}
            style={{ borderRadius: 14, overflow: 'hidden', marginTop: 8 }}
          >
            <LinearGradient
              colors={isLoading ? ['#555','#333'] : ['#833ab4','#c13584','#fd1d1d']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>
                {isLoading ? 'Creating…' : 'Create Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  blob1: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#2563EB',
    opacity: 0.08,
  },

  blob2: {
    position: 'absolute',
    bottom: 100,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#60A5FA',
    opacity: 0.08,
  },

  back: {
    marginBottom: 24,
  },

  backText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },

  header: {
    alignItems: 'center',
    marginBottom: 28,
  },

  logoGrad: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },

  sub: {
    fontSize: 13,
    color: '#64748B',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 8,
  },

  label: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },

  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  roleBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  roleBtnActive: {
    borderColor: 'transparent',
  },

  roleBtnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },

  roleBtnInner: {
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
  },

  roleLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  roleLabelActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    marginBottom: 12,
    height: 56,
  },

  inputFocused: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },

  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
  },

  btn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },

  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },

  loginText: {
    color: '#64748B',
    fontSize: 14,
  },

  loginAccent: {
    color: '#2563EB',
    fontWeight: '700',
  },
})

