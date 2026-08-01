import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { ToastItem, ToastType } from '@/components/ui/Toast'
import ToastContainer from '@/components/ui/Toast'

interface ToastContextValue {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => string
  dismissToast: (id: string) => void
  clearAll: () => void
  /** Convenience helpers */
  success: (title: string, description?: string) => string
  error: (title: string, description?: string) => string
  warning: (title: string, description?: string) => string
  info: (title: string, description?: string) => string
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let idCounter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>): string => {
      const id = `toast-${Date.now()}-${++idCounter}`
      const item: ToastItem = { ...toast, id }

      setToasts((prev) => [...prev, item])

      // Auto-dismiss
      const duration = toast.duration ?? 5000
      if (duration > 0) {
        const timer = setTimeout(() => dismissToast(id), duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismissToast],
  )

  const clearAll = useCallback(() => {
    setToasts([])
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  const createHelper = useCallback(
    (type: ToastType) => (title: string, description?: string) =>
      addToast({ type, title, description }),
    [addToast],
  )

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        dismissToast,
        clearAll,
        success: createHelper('success'),
        error: createHelper('error'),
        warning: createHelper('warning'),
        info: createHelper('info'),
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider')
  return ctx
}

/**
 * Shortcut hook for toast notifications.
 *
 * @example
 * const toast = useToast()
 * toast.success('Saved!', 'Changes have been applied.')
 * toast.error('Upload failed', 'The file is too large.')
 */
export function useToast() {
  return useToastContext()
}
