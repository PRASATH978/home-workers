import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../utils/api'

const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (data?.results) return data.results
  return []
}

// ─── SERVICES ─────────────────────────────────────────────────────────────────
export const fetchServices = createAsyncThunk('services/fetch', async () => {
  const res = await api.get('/services/')
  return toArray(res.data)
})

const servicesSlice = createSlice({
  name: 'services',
  initialState: { items: [], isLoading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchServices.pending,   s => { s.isLoading = true })
    b.addCase(fetchServices.fulfilled, (s, a) => { s.isLoading = false; s.items = a.payload })
    b.addCase(fetchServices.rejected,  s => { s.isLoading = false })
  },
})

// ─── WORKERS ──────────────────────────────────────────────────────────────────
export const fetchNearbyWorkers = createAsyncThunk('workers/fetchNearby', async ({ service, lat, lng } = {}) => {
  const params = new URLSearchParams()
  if (service) params.append('service', service)
  if (lat)     params.append('lat', lat)
  if (lng)     params.append('lng', lng)
  const res = await api.get(`/workers/nearby/?${params}`)
  return toArray(res.data)
})

export const fetchWorkerProfile = createAsyncThunk('workers/fetchProfile', async () => {
  const res = await api.get('/workers/profile/')
  return res.data
})

const workersSlice = createSlice({
  name: 'workers',
  initialState: { nearby: [], profile: null, isLoading: false },
  reducers: {
    toggleAvailability(state) {
      if (state.profile) state.profile.is_available = !state.profile.is_available
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchNearbyWorkers.pending,   s => { s.isLoading = true })
    b.addCase(fetchNearbyWorkers.fulfilled, (s, a) => { s.isLoading = false; s.nearby = a.payload })
    b.addCase(fetchNearbyWorkers.rejected,  s => { s.isLoading = false })
    b.addCase(fetchWorkerProfile.fulfilled, (s, a) => { s.profile = a.payload })
  },
})

export const { toggleAvailability } = workersSlice.actions

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
export const fetchMyBookings = createAsyncThunk('bookings/fetchMine', async () => {
  const res = await api.get('/bookings/')
  return toArray(res.data)
})

export const createBooking = createAsyncThunk('bookings/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/bookings/', data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchWorkerJobs = createAsyncThunk('bookings/fetchWorkerJobs', async (type = 'available', { rejectWithValue }) => {
  try {
    const res = await api.get(`/bookings/jobs/?type=${type}`)
    return { type, jobs: toArray(res.data) }
  } catch {
    return rejectWithValue({ type, jobs: [] })
  }
})

export const workerJobAction = createAsyncThunk('bookings/jobAction', async ({ bookingId, action, otp, final_price }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/bookings/jobs/${bookingId}/action/`, {
      action,
      ...(otp         ? { completion_otp: otp } : {}),
      ...(final_price ? { final_price }          : {}),
    })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    myBookings:    [],
    availableJobs: [],
    myJobs:        [],
    isLoading:     false,
  },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMyBookings.pending,   s => { s.isLoading = true })
    b.addCase(fetchMyBookings.fulfilled, (s, a) => {
      s.isLoading  = false
      s.myBookings = a.payload.sort((x, y) => new Date(y.created_at) - new Date(x.created_at))
    })
    b.addCase(fetchMyBookings.rejected,  s => { s.isLoading = false })

    b.addCase(createBooking.fulfilled, (s, a) => {
      s.myBookings = [a.payload, ...s.myBookings]
    })

    b.addCase(fetchWorkerJobs.pending,   s => { s.isLoading = true })
    b.addCase(fetchWorkerJobs.fulfilled, (s, a) => {
      s.isLoading = false
      if (a.payload.type === 'available') s.availableJobs = a.payload.jobs
      else                                s.myJobs        = a.payload.jobs
    })
    b.addCase(fetchWorkerJobs.rejected,  (s, a) => {
      s.isLoading = false
      if (a.payload?.type === 'available') s.availableJobs = []
      else                                 s.myJobs        = []
    })
  },
})

export const servicesReducer  = servicesSlice.reducer
export const workersReducer   = workersSlice.reducer
export const bookingsReducer  = bookingsSlice.reducer
