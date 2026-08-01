import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Notification } from '@/types'

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  add: (partial: Omit<Notification, 'id' | 'read' | 'created_at'>) => string
  remove: (id: string) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  isPanelOpen: boolean
  openPanel: () => void
  closePanel: () => void
  togglePanel: () => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

let idCounter = 0

const STORAGE_KEY = 'flowmind-notifications'
const MAX_STORED = 100

function loadFromStorage(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persist(notifications: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)))
  } catch {
    // Storage full — ignore
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(loadFromStorage)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Persist whenever notifications change
  useEffect(() => {
    persist(notifications)
  }, [notifications])

  const add = useCallback((partial: Omit<Notification, 'id' | 'read' | 'created_at'>): string => {
    const id = `notif-${Date.now()}-${++idCounter}`
    const notification: Notification = {
      ...partial,
      id,
      read: false,
      created_at: new Date().toISOString(),
    }
    setNotifications((prev) => [notification, ...prev.slice(0, MAX_STORED - 1)])
    return id
  }, [])

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const openPanel = useCallback(() => setIsPanelOpen(true), [])
  const closePanel = useCallback(() => setIsPanelOpen(false), [])
  const togglePanel = useCallback(() => setIsPanelOpen((p) => !p), [])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        add,
        remove,
        markRead,
        markAllRead,
        clearAll,
        isPanelOpen,
        openPanel,
        closePanel,
        togglePanel,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider')
  return ctx
}
