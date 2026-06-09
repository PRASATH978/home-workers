import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchMyBookings = createAsyncThunk('bookings/fetchMine', async () => {
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

export const workerJobAction = createAsyncThunk(
  'bookings/workerAction',
  async ({ bookingId, action, final_price, otp }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/bookings/jobs/${bookingId}/action/`, { action, final_price, otp })
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    myBookings: [],
    availableJobs: [],
    myJobs: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBookings.pending, (state) => { state.isLoading = true })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookings = action.payload
        state.isLoading = false
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.myBookings.unshift(action.payload)
      })
      .addCase(fetchWorkerJobs.fulfilled, (state, action) => {
        const { filter, data } = action.payload
        if (filter === 'available') state.availableJobs = data
        else state.myJobs = data
      })
  },
})

export default bookingsSlice.reducer
