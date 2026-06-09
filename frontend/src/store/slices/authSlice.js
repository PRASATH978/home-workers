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
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.access = null
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
    },
    clearError(state) { state.error = null },
  },
  extraReducers: (builder) => {
    const handlePending = (state) => { state.isLoading = true; state.error = null }
    const handleFulfilled = (state, action) => {
      state.isLoading = false
      if (action.payload.user) state.user = action.payload.user
      if (action.payload.access) state.access = action.payload.access
    }
    const handleRejected = (state, action) => {
      state.isLoading = false
      state.error = action.payload
    }

    ;[login, register, verifyOTP].forEach(thunk => {
      builder.addCase(thunk.pending, handlePending)
      builder.addCase(thunk.fulfilled, handleFulfilled)
      builder.addCase(thunk.rejected, handleRejected)
    })

    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.user = action.payload
    })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
