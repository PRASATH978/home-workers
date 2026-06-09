import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

// ─── Services ────────────────────────────────────────────────────────────────
export const fetchServices = createAsyncThunk('services/fetch', async () => {
  const res = await api.get('/services/')
  return res.data.results || res.data
})

const servicesSlice = createSlice({
  name: 'services',
  initialState: { items: [], isLoading: false },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchServices.pending, s => { s.isLoading = true })
    b.addCase(fetchServices.fulfilled, (s, a) => { s.items = a.payload; s.isLoading = false })
  },
})
export const servicesReducer = servicesSlice.reducer

// ─── Workers ─────────────────────────────────────────────────────────────────
export const fetchNearbyWorkers = createAsyncThunk('workers/nearby', async ({ service, lat, lng, radius = 20 }) => {
  const params = new URLSearchParams({ radius })
  if (service) params.append('service', service)
  if (lat) params.append('lat', lat)
  if (lng) params.append('lng', lng)
  const res = await api.get(`/workers/nearby/?${params}`)
  return res.data.results || res.data
})

export const fetchWorkerProfile = createAsyncThunk('workers/profile', async () => {
  const res = await api.get('/workers/profile/')
  return res.data
})

const workersSlice = createSlice({
  name: 'workers',
  initialState: { nearby: [], profile: null, isLoading: false },
  reducers: {
    toggleAvailability: s => { if (s.profile) s.profile.is_available = !s.profile.is_available },
  },
  extraReducers: b => {
    b.addCase(fetchNearbyWorkers.pending, s => { s.isLoading = true })
    b.addCase(fetchNearbyWorkers.fulfilled, (s, a) => { s.nearby = a.payload; s.isLoading = false })
    b.addCase(fetchWorkerProfile.fulfilled, (s, a) => { s.profile = a.payload })
  },
})
export const { toggleAvailability } = workersSlice.actions
export const workersReducer = workersSlice.reducer

// ─── Bookings ────────────────────────────────────────────────────────────────
export const fetchMyBookings = createAsyncThunk('bookings/mine', async () => {
  const res = await api.get('/bookings/')
  return res.data.results || res.data
})

export const createBooking = createAsyncThunk('bookings/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/bookings/', data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchWorkerJobs = createAsyncThunk('bookings/workerJobs', async (filter = 'available') => {
  const res = await api.get(`/bookings/jobs/?filter=${filter}`)
  return { filter, data: res.data.results || res.data }
})

export const workerJobAction = createAsyncThunk('bookings/action', async ({ bookingId, action, ...extra }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/bookings/jobs/${bookingId}/action/`, { action, ...extra })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: { myBookings: [], availableJobs: [], myJobs: [], isLoading: false },
  reducers: {},
  extraReducers: b => {
    b.addCase(fetchMyBookings.pending, s => { s.isLoading = true })
    b.addCase(fetchMyBookings.fulfilled, (s, a) => { s.myBookings = a.payload; s.isLoading = false })
    b.addCase(createBooking.fulfilled, (s, a) => { s.myBookings.unshift(a.payload) })
    b.addCase(fetchWorkerJobs.fulfilled, (s, a) => {
      if (a.payload.filter === 'available') s.availableJobs = a.payload.data
      else s.myJobs = a.payload.data
    })
  },
})
export const bookingsReducer = bookingsSlice.reducer
