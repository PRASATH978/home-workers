import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as SecureStore from 'expo-secure-store'
import api from '../utils/api'

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login/', data)
    await SecureStore.setItemAsync('access_token', res.data.access)
    await SecureStore.setItemAsync('refresh_token', res.data.refresh)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' })
  }
})

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register/', data)
    await SecureStore.setItemAsync('access_token', res.data.access)
    await SecureStore.setItemAsync('refresh_token', res.data.refresh)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  const token = await SecureStore.getItemAsync('access_token')
  if (!token) throw new Error('No token')
  const res = await api.get('/auth/profile/')
  return { user: res.data, access: token }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, access: null, isLoading: false, isBootstrapped: false },
  reducers: {
    logout: (state) => {
      state.user = null
      state.access = null
      SecureStore.deleteItemAsync('access_token')
      SecureStore.deleteItemAsync('refresh_token')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, s => { s.isLoading = true })
      .addCase(login.fulfilled, (s, a) => {
        s.isLoading = false
        s.user = a.payload.user
        s.access = a.payload.access
      })
      .addCase(login.rejected, s => { s.isLoading = false })
      .addCase(register.fulfilled, (s, a) => {
        s.user = a.payload.user
        s.access = a.payload.access
      })
      .addCase(loadUser.fulfilled, (s, a) => {
        s.user = a.payload.user
        s.access = a.payload.access
        s.isBootstrapped = true
      })
      .addCase(loadUser.rejected, s => { s.isBootstrapped = true })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
