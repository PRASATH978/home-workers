import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as SecureStore from 'expo-secure-store'
import api from '../utils/api'

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const access = await SecureStore.getItemAsync('access')
    if (!access) return rejectWithValue('No token')
    const res = await api.get('/auth/profile/')
    return { user: res.data, access }
  } catch {
    await SecureStore.deleteItemAsync('access')
    await SecureStore.deleteItemAsync('refresh')
    return rejectWithValue('Session expired')
  }
})

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login/', data)
    await SecureStore.setItemAsync('access',  res.data.access)
    await SecureStore.setItemAsync('refresh', res.data.refresh)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' })
  }
})

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register/', data)
    await SecureStore.setItemAsync('access',  res.data.access)
    await SecureStore.setItemAsync('refresh', res.data.refresh)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Registration failed' })
  }
})

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/profile/')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:           null,
    access:         null,
    isLoading:      false,
    isBootstrapped: false,
    error:          null,
  },
  reducers: {
    logout(state) {
      state.user   = null
      state.access = null
      SecureStore.deleteItemAsync('access').catch(() => {})
      SecureStore.deleteItemAsync('refresh').catch(() => {})
    },
    clearError(state) { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending,   s => { s.isBootstrapped = false })
      .addCase(loadUser.fulfilled, (s, a) => {
        s.user           = a.payload.user
        s.access         = a.payload.access
        s.isBootstrapped = true
      })
      .addCase(loadUser.rejected,  s => {
        s.user           = null
        s.access         = null
        s.isBootstrapped = true
      })

    builder
      .addCase(login.pending,   s => { s.isLoading = true; s.error = null })
      .addCase(login.fulfilled, (s, a) => {
        s.isLoading = false
        s.user      = a.payload.user
        s.access    = a.payload.access
      })
      .addCase(login.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    builder
      .addCase(register.pending,   s => { s.isLoading = true; s.error = null })
      .addCase(register.fulfilled, (s, a) => {
        s.isLoading = false
        s.user      = a.payload.user
        s.access    = a.payload.access
      })
      .addCase(register.rejected,  (s, a) => { s.isLoading = false; s.error = a.payload })

    builder
      .addCase(fetchProfile.fulfilled, (s, a) => { s.user = a.payload })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
