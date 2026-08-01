import { useEffect, useCallback } from 'react'

type KeyCombo = string

interface KeyboardOptions {
  /** Enable / disable the hook */
  enabled?: boolean
  /** Only fire when input is not focused */
  ignoreInputs?: boolean
  /** Prevent browser default for the combo */
  preventDefault?: boolean
  /** Use capture phase */
  capture?: boolean
}

/**
 * React hook for keyboard shortcuts.
 *
 * Supports:
 * - Single keys: 'Escape', 'Enter', 'a'
 * - Modifiers: 'ctrl+k', 'cmd+s', 'shift+a', 'ctrl+shift+p'
 *
 * @example
 * useKeyboard('Escape', () => closeModal())
 * useKeyboard('ctrl+k', () => openSearch(), { preventDefault: true })
 */
export function useKeyboard(
  combo: KeyCombo,
  callback: (event: KeyboardEvent) => void,
  options: KeyboardOptions = {},
): void {
  const {
    enabled = true,
    ignoreInputs = true,
    preventDefault = false,
    capture = false,
  } = options

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      // Ignore when typing in inputs
      if (ignoreInputs) {
        const target = event.target as HTMLElement
        const isInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        if (isInput) return
      }

      if (matchCombo(event, combo)) {
        if (preventDefault) event.preventDefault()
        callback(event)
      }
    },
    [combo, callback, enabled, ignoreInputs, preventDefault],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, capture)
    return () => document.removeEventListener('keydown', handleKeyDown, capture)
  }, [handleKeyDown, capture])
}

/**
 * Returns true while the given key(s) are held down.
 *
 * @example
 * const shiftDown = useKeyDown('Shift')
 */
export function useKeyDown(key: string): boolean {
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === key) setPressed(true)
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === key) setPressed(false)
    }
    document.addEventListener('keydown', down)
    document.addEventListener('keyup', up)
    return () => {
      document.removeEventListener('keydown', down)
      document.removeEventListener('keyup', up)
    }
  }, [key])

  return pressed
}

import { useState } from 'react'

function matchCombo(event: KeyboardEvent, combo: KeyCombo): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1]

  const cmd = parts.includes('cmd') || parts.includes('meta')
  const ctrl = parts.includes('ctrl') || parts.includes('control')
  const shift = parts.includes('shift')
  const alt = parts.includes('alt') || parts.includes('option')

  const cmdOk = !cmd || event.metaKey || event.ctrlKey
  const ctrlOk = !ctrl || event.ctrlKey
  const shiftOk = !shift || event.shiftKey
  const altOk = !alt || event.altKey

  const keyMap: Record<string, string[]> = {
    escape: ['escape', 'esc'],
    enter: ['enter'],
    space: [' ', 'spacebar'],
    arrowup: ['arrowup', 'up'],
    arrowdown: ['arrowdown', 'down'],
    arrowleft: ['arrowleft', 'left'],
    arrowright: ['arrowright', 'right'],
    backspace: ['backspace'],
    tab: ['tab'],
    delete: ['delete', 'del'],
  }

  const keyNormalized = key.toLowerCase()
  const eventKey = event.key.toLowerCase()
  const aliases = keyMap[keyNormalized] ?? [keyNormalized]
  const keyOk = aliases.includes(eventKey)

  return cmdOk && ctrlOk && shiftOk && altOk && keyOk
}
