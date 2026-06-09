import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import { servicesReducer, workersReducer, bookingsReducer } from './slices'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    services: servicesReducer,
    workers: workersReducer,
    bookings: bookingsReducer,
  },
})
