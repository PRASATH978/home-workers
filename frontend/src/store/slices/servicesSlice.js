import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchServices = createAsyncThunk(
  'services/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/services/')
      return Array.isArray(res.data) ? res.data : (res.data.results ?? [])
    } catch (err) {
      return rejectWithValue(err.response?.data)
    }
  }
)

const servicesSlice = createSlice({
  name: 'services',
  initialState: {
    items: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})

export const servicesReducer = servicesSlice.reducer
export default servicesSlice.reducer
