import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchNearbyWorkers = createAsyncThunk(
  'workers/fetchNearby',
  async ({ service, lat, lng, radius } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams()
      if (service) params.append('service', service)
      if (lat)     params.append('lat', lat)
      if (lng)     params.append('lng', lng)
      if (radius)  params.append('radius', radius)
      const res = await api.get(`/workers/nearby/?${params}`)
      // Handle both paginated { results: [] } and plain []
      return Array.isArray(res.data) ? res.data : (res.data.results ?? [])
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: 'Failed to fetch workers' })
    }
  }
)

export const fetchWorkerProfile = createAsyncThunk(
  'workers/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/workers/profile/')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

const workersSlice = createSlice({
  name: 'workers',
  initialState: {
    nearby: [],
    profile: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    toggleAvailability(state) {
      if (state.profile) {
        state.profile.is_available = !state.profile.is_available
      }
    },
    clearWorkers(state) {
      state.nearby = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyWorkers.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchNearbyWorkers.fulfilled, (state, action) => {
        state.nearby = action.payload
        state.isLoading = false
      })
      .addCase(fetchNearbyWorkers.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.nearby = []
      })
      .addCase(fetchWorkerProfile.fulfilled, (state, action) => {
        state.profile = action.payload
      })
  },
})

export const { toggleAvailability, clearWorkers } = workersSlice.actions
export default workersSlice.reducer
