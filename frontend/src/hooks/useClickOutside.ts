import { useEffect, useRef, type RefObject } from 'react'

/**
 * Detects clicks outside the given element ref.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null)
 * useClickOutside(ref, () => setOpen(false))
 * return <div ref={ref}>...</div>
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  active = true,
): void {
  const savedHandler = useRef(handler)
  savedHandler.current = handler

  useEffect(() => {
    if (!active) return

    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current) return
      if (ref.current.contains(event.target as Node)) return
      savedHandler.current(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, active])
}

/**
 * Detects when focus leaves the given element ref.
 */
export function useFocusOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: FocusEvent) => void,
): void {
  const savedHandler = useRef(handler)
  savedHandler.current = handler

  useEffect(() => {
    const listener = (event: FocusEvent) => {
      if (!ref.current) return
      if (ref.current.contains(event.relatedTarget as Node)) return
      savedHandler.current(event)
    }

    ref.current?.addEventListener('focusout', listener)
    return () => {
      ref.current?.removeEventListener('focusout', listener)
    }
  }, [ref])
}
