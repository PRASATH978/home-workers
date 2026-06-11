import { useCallback, useEffect, useRef } from 'react'
import adminApi from '../../utils/adminApi'
import toast from 'react-hot-toast'

/**
 * AdminPoller
 * Polls admin endpoints every 15 seconds.
 * Calls onBookingsUpdate(bookings) and onWorkersUpdate(workers)
 * with fresh data so the parent page can setState.
 */
export default function AdminPoller({ onBookingsUpdate, onWorkersUpdate, enabled = true }) {
  const prevBookingCountRef = useRef(null)
  const prevPendingWorkers  = useRef(null)
  const intervalRef = useRef(null)

  const poll = useCallback(async () => {
    try {
      const [bookingsRes, workersRes] = await Promise.all([
        adminApi.get('/workers/bookings-all/').catch(() => null),
        adminApi.get('/workers/all/').catch(() => null),
      ])

      if (bookingsRes) {
        const bookings = Array.isArray(bookingsRes.data)
          ? bookingsRes.data
          : bookingsRes.data.results || []

        // Notify if new booking arrived
        if (prevBookingCountRef.current !== null && bookings.length > prevBookingCountRef.current) {
          toast('📋 New booking received!', {
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #f97316' },
            duration: 4000,
          })
        }
        prevBookingCountRef.current = bookings.length
        onBookingsUpdate?.(bookings)
      }

      if (workersRes) {
        const workers = Array.isArray(workersRes.data)
          ? workersRes.data
          : workersRes.data.results || []

        // Notify if new worker registered
        const pendingCount = workers.filter(w => w.verification_status === 'pending').length
        if (prevPendingWorkers.current !== null && pendingCount > prevPendingWorkers.current) {
          toast('👷 New worker pending verification!', {
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #f59e0b' },
            duration: 5000,
          })
        }
        prevPendingWorkers.current = pendingCount
        onWorkersUpdate?.(workers)
      }
    } catch {
      // Silent fail — network errors shouldn't break the UI
    }
  }, [onBookingsUpdate, onWorkersUpdate])

  useEffect(() => {
    if (!enabled) return

    poll() // immediate first call

    intervalRef.current = setInterval(poll, 15000) // every 15 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, poll])

  return null
}
