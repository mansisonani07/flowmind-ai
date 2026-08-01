import { useState, useEffect } from 'react'

/**
 * Debounces a value by the specified delay.
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * // debouncedSearch updates 300ms after search stops changing
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Returns a debounced version of a callback function.
 *
 * @example
 * const debouncedSave = useDebounceFn(() => saveDraft(), 500)
 */
export function useDebounceFn<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number,
): T {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [timer])

  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer)
    setTimer(setTimeout(() => {
      callback(...args)
    }, delay))
  }) as T
}
