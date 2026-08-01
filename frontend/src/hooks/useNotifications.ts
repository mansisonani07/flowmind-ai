import { useState, useCallback } from 'react'
import type { Notification } from '@/types'

/**
 * Manages app-level notifications with mark-read, dismiss, and clear-all functionality.
 *
 * @example
 * const { notifications, unreadCount, addNotification, markAsRead, markAllRead } = useNotifications()
 *
 * // Push a notification
 * addNotification({ type: 'system', title: 'Upload complete', message: 'File processed.' })
 */
export function useNotifications(initial?: Notification[]) {
  const [notifications, setNotifications] = useState<Notification[]>(initial ?? [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const addNotification = useCallback((partial: Omit<Notification, 'id' | 'read' | 'created_at'>) => {
    const notification: Notification = {
      ...partial,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      read: false,
      created_at: new Date().toISOString(),
    }
    setNotifications((prev) => [notification, ...prev])
    return notification.id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const dismissOldest = useCallback((count = 1) => {
    setNotifications((prev) => prev.slice(count))
  }, [])

  const getUnreadByType = useCallback(
    (type: Notification['type']) =>
      notifications.filter((n) => n.type === type && !n.read),
    [notifications],
  )

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllRead,
    clearAll,
    dismissOldest,
    getUnreadByType,
  }
}
