import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

// ─── Services Slice ───────────────────────────────────────────────────────────
export const fetchServices = createAsyncThunk('services/fetchAll', async () => {
  const res = await api.get('/services/')
  return res.data.results || res.data
})

const servicesSlice = createSlice({
  name: 'services',
  initialState: { items: [], isLoading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => { state.isLoading = true })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.items = action.payload
        state.isLoading = false
      })
  },
})

export const servicesReducer = servicesSlice.reducer
export default servicesSlice.reducer
