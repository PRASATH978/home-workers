import { useDispatch, useSelector } from 'react-redux'
import { useCallback } from 'react'
import { usePolling } from '../../hooks/usePolling'
import { useNewItemNotification, useStatusChangeNotification } from '../../hooks/useNotification'
import { fetchMyBookings, fetchWorkerJobs } from '../../store/slices/bookingsSlice'
import { fetchWorkerProfile } from '../../store/slices/workersSlice'

const CUSTOMER_POLL_MS = 10000  // 10 seconds
const WORKER_POLL_MS   = 8000   // 8 seconds

/**
 * GlobalPoller
 * Drop this inside Layout — it silently polls the right endpoints
 * based on the logged-in user's role.
 * Renders nothing visible.
 */
export default function GlobalPoller() {
  const dispatch = useDispatch()
  const user    = useSelector(s => s.auth.user)
  const { myBookings }   = useSelector(s => s.bookings)
  const { availableJobs, myJobs } = useSelector(s => s.bookings)

  const isCustomer = user?.role === 'customer'
  const isWorker   = user?.role === 'worker'

  // ── Customer polling ──────────────────────────────────────────────────────
  const pollCustomerBookings = useCallback(
    () => dispatch(fetchMyBookings()),
    [dispatch]
  )
  usePolling(pollCustomerBookings, CUSTOMER_POLL_MS, isCustomer)

  // Notify customer when booking status changes (e.g. worker accepted)
  useStatusChangeNotification(
    myBookings,
    'id',
    'status',
    '✅ Your booking status was updated!'
  )

  // ── Worker polling ────────────────────────────────────────────────────────
  const pollAvailableJobs = useCallback(
    () => dispatch(fetchWorkerJobs('available')),
    [dispatch]
  )
  const pollMyJobs = useCallback(
    () => dispatch(fetchWorkerJobs('mine')),
    [dispatch]
  )
  const pollWorkerProfile = useCallback(
    () => dispatch(fetchWorkerProfile()),
    [dispatch]
  )

  usePolling(pollAvailableJobs,  WORKER_POLL_MS, isWorker)
  usePolling(pollMyJobs,         WORKER_POLL_MS, isWorker)
  usePolling(pollWorkerProfile,  30000,          isWorker) // profile every 30s

  // Notify worker when a new job comes in
  useNewItemNotification(
    availableJobs,
    '🔔 New job available near you!'
  )

  return null // renders nothing
}
