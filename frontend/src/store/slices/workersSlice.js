import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchNearbyWorkers = createAsyncThunk(
  'workers/fetchNearby',
  async ({ service, lat, lng, radius = 20 }) => {
    const params = new URLSearchParams({ radius })
    if (service) params.append('service', service)
    if (lat) params.append('lat', lat)
    if (lng) params.append('lng', lng)
    const res = await api.get(`/workers/nearby/?${params}`)
    return res.data.results || res.data
  }
)

export const fetchWorkerProfile = createAsyncThunk('workers/fetchProfile', async () => {
  const res = await api.get('/workers/profile/')
  return res.data
})

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
      if (state.profile) state.profile.is_available = !state.profile.is_available
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNearbyWorkers.pending, (state) => { state.isLoading = true })
      .addCase(fetchNearbyWorkers.fulfilled, (state, action) => {
        state.nearby = action.payload
        state.isLoading = false
      })
      .addCase(fetchWorkerProfile.fulfilled, (state, action) => {
        state.profile = action.payload
      })
  },
})

export const { toggleAvailability } = workersSlice.actions
export default workersSlice.reducer
