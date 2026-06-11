import { useEffect, useRef, useCallback } from 'react'

/**
 * usePolling
 * Calls `fn` immediately, then every `intervalMs` milliseconds.
 * Stops when the component unmounts or when `enabled` is false.
 *
 * Usage:
 *   usePolling(() => dispatch(fetchMyBookings()), 10000)
 *   usePolling(() => dispatch(fetchWorkerJobs('available')), 8000, isWorkerOnline)
 */
export function usePolling(fn, intervalMs = 10000, enabled = true) {
  const fnRef = useRef(fn)

  // Keep ref current so interval always calls latest fn
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    if (!enabled) return

    // Call immediately on mount
    fnRef.current()

    const id = setInterval(() => {
      fnRef.current()
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs, enabled])
}
