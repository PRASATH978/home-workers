import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import bookingsReducer from './slices/bookingsSlice'
import workersReducer from './slices/workersSlice'
import servicesReducer from './slices/servicesSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingsReducer,
    workers: workersReducer,
    services: servicesReducer,
  },
})
