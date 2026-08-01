import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import type { WSMessage } from '@/types'

type WSStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

interface WebSocketContextValue {
  status: WSStatus
  lastMessage: WSMessage | null
  send: (data: unknown) => void
  connect: () => void
  disconnect: () => void
  /** Subscribe to specific message types */
  on: (type: WSMessage['type'], handler: (payload: unknown) => void) => () => void
  /** Remove all subscriptions */
  offAll: () => void
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined)

export function WebSocketProvider({
  children,
  url,
  autoConnect = true,
}: {
  children: ReactNode
  url: string
  autoConnect?: boolean
}) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentionalCloseRef = useRef(false)
  const listenersRef = useRef<Map<string, Set<(payload: unknown) => void>>>(new Map())

  const [status, setStatus] = useState<WSStatus>('idle')
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    intentionalCloseRef.current = false
    setStatus('connecting')

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setStatus('connected')
        reconnectCountRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as WSMessage
          setLastMessage(msg)

          // Fan-out to type-specific listeners
          const handlers = listenersRef.current.get(msg.type)
          if (handlers) {
            handlers.forEach((fn) => fn(msg.payload))
          }
        } catch {
          console.warn('[WebSocketContext] Failed to parse message')
        }
      }

      ws.onclose = () => {
        setStatus('disconnected')
        wsRef.current = null

        // Auto-reconnect
        if (!intentionalCloseRef.current && reconnectCountRef.current < 15) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000)
          reconnectCountRef.current++
          reconnectTimerRef.current = setTimeout(() => connect(), delay)
        }
      }

      ws.onerror = () => {
        setStatus('error')
      }

      wsRef.current = ws
    } catch (e) {
      console.error('[WebSocketContext] Connection error:', e)
      setStatus('error')
    }
  }, [url])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual close')
      wsRef.current = null
    }
  }, [])

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof data === 'string' ? data : JSON.stringify(data))
    } else {
      console.warn('[WebSocketContext] Cannot send — not connected')
    }
  }, [])

  const on = useCallback((type: WSMessage['type'], handler: (payload: unknown) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set())
    }
    listenersRef.current.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      listenersRef.current.get(type)?.delete(handler)
    }
  }, [])

  const offAll = useCallback(() => {
    listenersRef.current.clear()
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) connect()
    return () => disconnect()
  }, [autoConnect]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <WebSocketContext.Provider
      value={{ status, lastMessage, send, connect, disconnect, on, offAll }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext)
  if (!ctx) throw new Error('useWebSocketContext must be used within WebSocketProvider')
  return ctx
}

/**
 * Shortcut hook for subscribing to specific WS message types.
 *
 * @example
 * const { status, on } = useAppWebSocket()
 * useEffect(() => {
 *   return on('new_conversation', (payload) => {
 *     console.log('New conversation:', payload)
 *   })
 * }, [])
 */
export function useAppWebSocket() {
  return useWebSocketContext()
}
