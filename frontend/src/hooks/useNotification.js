import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

/**
 * useNewItemNotification
 * Compares previous list length to current.
 * Shows a toast when new items arrive silently via polling.
 *
 * Usage:
 *   useNewItemNotification(availableJobs, '🔔 New job available!')
 *   useNewItemNotification(myBookings, '📋 Booking status updated')
 */
export function useNewItemNotification(items, message, skipFirst = true) {
  const prevCountRef = useRef(null)
  const isFirstRef   = useRef(true)

  useEffect(() => {
    if (!items) return

    const count = items.length

    if (isFirstRef.current) {
      // Store initial count without showing toast
      prevCountRef.current = count
      isFirstRef.current   = false
      return
    }

    if (count > prevCountRef.current) {
      toast(message, {
        icon: '🔔',
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #f97316',
        },
        duration: 4000,
      })
    }

    prevCountRef.current = count
  }, [items?.length])
}

/**
 * useStatusChangeNotification
 * Detects when any item's status field changes and shows a toast.
 *
 * Usage:
 *   useStatusChangeNotification(myBookings, 'id', 'status', 'Your booking status changed!')
 */
export function useStatusChangeNotification(items, idField, statusField, message) {
  const prevMapRef = useRef({})
  const isFirstRef = useRef(true)

  useEffect(() => {
    if (!items?.length) return

    const currentMap = {}
    items.forEach(item => {
      currentMap[item[idField]] = item[statusField]
    })

    if (isFirstRef.current) {
      prevMapRef.current = currentMap
      isFirstRef.current = false
      return
    }

    // Check for status changes
    let changed = false
    Object.keys(currentMap).forEach(id => {
      if (prevMapRef.current[id] && prevMapRef.current[id] !== currentMap[id]) {
        changed = true
      }
    })

    if (changed) {
      toast(message, {
        icon: '📋',
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #3b82f6',
        },
        duration: 4000,
      })
    }

    prevMapRef.current = currentMap
  }, [JSON.stringify(items?.map(i => `${i[idField]}:${i[statusField]}`))])
}
