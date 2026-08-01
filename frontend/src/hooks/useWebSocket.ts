import { useEffect, useRef, useState, useCallback } from 'react'
import type { WSMessage } from '@/types'

type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

interface UseWebSocketOptions {
  /** WebSocket URL */
  url: string
  /** Protocols */
  protocols?: string | string[]
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean
  /** Max reconnect attempts */
  maxReconnects?: number
  /** Reconnect delay in ms (increases exponentially) */
  reconnectDelay?: number
  /** Enable / disable the connection */
  enabled?: boolean
  /** Called on every message */
  onMessage?: (message: WSMessage) => void
  /** Called on connection open */
  onOpen?: (event: Event) => void
  /** Called on connection close */
  onClose?: (event: CloseEvent) => void
  /** Called on error */
  onError?: (event: Event) => void
}

interface UseWebSocketReturn {
  /** Current connection status */
  status: WSStatus
  /** Send a message through the WebSocket */
  send: (data: unknown) => void
  /** Manually open the connection */
  connect: () => void
  /** Manually close the connection */
  disconnect: () => void
  /** Last received message */
  lastMessage: WSMessage | null
}

/**
 * WebSocket hook with auto-reconnect, status tracking, and message handling.
 *
 * @example
 * const { status, send, lastMessage } = useWebSocket({
 *   url: '/?XTransformPort=3003',
 *   onMessage: (msg) => console.log(msg),
 *   autoReconnect: true,
 * })
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    protocols,
    autoReconnect = true,
    maxReconnects = 10,
    reconnectDelay = 1000,
    enabled = true,
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intentionalCloseRef = useRef(false)

  const [status, setStatus] = useState<WSStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (!enabled) return
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return

    intentionalCloseRef.current = false
    setStatus('connecting')

    try {
      const ws = protocols ? new WebSocket(url, protocols) : new WebSocket(url)

      ws.onopen = (event) => {
        setStatus('connected')
        reconnectCountRef.current = 0
        onOpen?.(event)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as WSMessage
          setLastMessage(data)
          onMessage?.(data)
        } catch {
          console.warn('[useWebSocket] Failed to parse message:', event.data)
        }
      }

      ws.onclose = (event) => {
        setStatus('disconnected')
        onClose?.(event)
        wsRef.current = null

        // Auto-reconnect
        if (autoReconnect && !intentionalCloseRef.current && reconnectCountRef.current < maxReconnects) {
          const delay = Math.min(reconnectDelay * Math.pow(2, reconnectCountRef.current), 30000)
          reconnectCountRef.current++
          reconnectTimerRef.current = setTimeout(() => connect(), delay)
        }
      }

      ws.onerror = (event) => {
        setStatus('error')
        onError?.(event)
      }

      wsRef.current = ws
    } catch (e) {
      console.error('[useWebSocket] Connection error:', e)
      setStatus('error')
    }
  }, [url, protocols, enabled, autoReconnect, maxReconnects, reconnectDelay, onOpen, onMessage, onClose, onError])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true
    clearReconnectTimer()
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual close')
      wsRef.current = null
    }
  }, [clearReconnectTimer])

  const send = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data)
      wsRef.current.send(payload)
    } else {
      console.warn('[useWebSocket] Cannot send — WebSocket is not connected')
    }
  }, [])

  // Connect on mount and cleanup on unmount
  useEffect(() => {
    if (enabled) connect()
    return () => disconnect()
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return { status, send, connect, disconnect, lastMessage }
}
