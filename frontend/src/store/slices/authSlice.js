import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login/', data)
    localStorage.setItem('access', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Login failed' })
  }
})

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register/', data)
    localStorage.setItem('access', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
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
    // Token is invalid/expired — clear it
    if (err.response?.status === 401) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
    }
    return rejectWithValue(err.response?.data)
  }
})

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/otp/verify/', data)
    localStorage.setItem('access', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    access: localStorage.getItem('access'),
    isLoading: false,
    isBootstrapping: !!localStorage.getItem('access'), // true only if token exists on load
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.access = null
      state.isBootstrapping = false
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── login ──────────────────────────────────────────────────────────────
    builder
      .addCase(login.pending, s => { s.isLoading = true; s.error = null })
      .addCase(login.fulfilled, (s, a) => {
        s.isLoading = false
        s.user   = a.payload.user
        s.access = a.payload.access
      })
      .addCase(login.rejected, (s, a) => {
        s.isLoading = false
        s.error = a.payload
      })

    // ── register ───────────────────────────────────────────────────────────
    builder
      .addCase(register.pending, s => { s.isLoading = true; s.error = null })
      .addCase(register.fulfilled, (s, a) => {
        s.isLoading = false
        s.user   = a.payload.user
        s.access = a.payload.access
      })
      .addCase(register.rejected, (s, a) => {
        s.isLoading = false
        s.error = a.payload
      })

    // ── fetchProfile (called on every app load) ────────────────────────────
    builder
      .addCase(fetchProfile.pending, s => {
        s.isBootstrapping = true
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.user = a.payload
        s.isBootstrapping = false
      })
      .addCase(fetchProfile.rejected, (s) => {
        // Token was invalid — clear everything
        s.user = null
        s.access = null
        s.isBootstrapping = false
      })

    // ── verifyOTP ──────────────────────────────────────────────────────────
    builder
      .addCase(verifyOTP.fulfilled, (s, a) => {
        s.user   = a.payload.user
        s.access = a.payload.access
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
