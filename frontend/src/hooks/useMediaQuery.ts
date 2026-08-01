import { useState, useEffect } from 'react'

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

/**
 * Reactive media query hook matching Tailwind CSS breakpoints.
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * const isMd = useBreakpoint('md') // >= 768px
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    setMatches(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Returns true if the viewport width is >= the given Tailwind breakpoint.
 *
 * @example
 * const isMd = useBreakpoint('md')   // true when width >= 768px
 * const isLg = useBreakpoint('lg')  // true when width >= 1024px
 */
export function useBreakpoint(bp: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[bp]}px)`)
}

/**
 * Returns the current active breakpoint name.
 *
 * @example
 * const current = useCurrentBreakpoint() // 'md'
 */
export function useCurrentBreakpoint(): Breakpoint {
  const bps: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  for (const bp of bps.reverse()) {
    if (useMediaQuery(`(min-width: ${breakpoints[bp]}px)`)) return bp
  }
  return 'xs'
}

/**
 * Returns true when viewport is mobile (< md breakpoint).
 */
export function useIsMobile(): boolean {
  return !useBreakpoint('md')
}
