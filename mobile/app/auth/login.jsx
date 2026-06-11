
import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useDispatch, useSelector } from 'react-redux'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { login } from '../../src/store/authSlice'

export default function LoginScreen() {
  const dispatch = useDispatch()
  const { isLoading } = useSelector(state => state.auth)

  const [form, setForm] = useState({
    phone: '',
    password: '',
  })

  const [focused, setFocused] = useState('')

  const handleLogin = async () => {
    if (!form.phone || !form.password) {
      Toast.show({
        type: 'error',
        text1: 'Please fill all fields',
      })
      return
    }

    const result = await dispatch(login(form))

    if (result.meta.requestStatus === 'fulfilled') {
      const user = result.payload.user

      router.replace(
        user.role === 'worker'
          ? '/worker'
          : '/customer'
      )
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid phone or password',
      })
    }
  }

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
        {/* Background Shapes */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            style={styles.logoGradient}
          >
            <Text style={styles.logoLetters}>LS</Text>
          </LinearGradient>

          <Text style={styles.logoText}>
            Local<Text style={styles.logoAccent}>Service</Text>
          </Text>

          <Text style={styles.logoSub}>
            Trusted Home Services Near You
          </Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>

          <Text style={styles.cardSub}>
            Sign in to continue
          </Text>

          {/* Phone */}
          <View
            style={[
              styles.inputWrap,
              focused === 'phone' && styles.inputFocused,
            ]}
          >
            <Text style={styles.icon}>📱</Text>

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={text =>
                setForm({ ...form, phone: text })
              }
              onFocus={() => setFocused('phone')}
              onBlur={() => setFocused('')}
            />
          </View>

          {/* Password */}
          <View
            style={[
              styles.inputWrap,
              focused === 'password' && styles.inputFocused,
            ]}
          >
            <Text style={styles.icon}>🔒</Text>

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={form.password}
              onChangeText={text =>
                setForm({ ...form, password: text })
              }
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
            />
          </View>

          {/* Login Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleLogin}
            disabled={isLoading}
            style={{ marginTop: 10 }}
          >
            <LinearGradient
              colors={
                isLoading
                  ? ['#94A3B8', '#64748B']
                  : ['#2563EB', '#1D4ED8']
              }
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                {isLoading
                  ? 'Signing In...'
                  : 'Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          {/* Register */}
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerText}>
              Don't have an account?{' '}
              <Text style={styles.registerLink}>
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Local Service Connect • Krishnagiri
        </Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  blob1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#2563EB',
    opacity: 0.08,
  },

  blob2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#60A5FA',
    opacity: 0.08,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },

  logoGradient: {
    width: 85,
    height: 85,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  logoLetters: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },

  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },

  logoAccent: {
    color: '#2563EB',
  },

  logoSub: {
    color: '#64748B',
    marginTop: 4,
    fontSize: 13,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 8,
  },

  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
  },

  cardSub: {
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 24,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 15,
    height: 56,
    marginBottom: 14,
  },

  inputFocused: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },

  icon: {
    fontSize: 18,
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
  },

  loginButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  orText: {
    marginHorizontal: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  registerText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
  },

  registerLink: {
    color: '#2563EB',
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    marginTop: 30,
    color: '#94A3B8',
    fontSize: 12,
  },
})

