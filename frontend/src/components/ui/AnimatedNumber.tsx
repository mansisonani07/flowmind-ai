import { useEffect, useRef } from 'react'
import { animate, useMotionValue, useTransform, useSpring, motion } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
}

export function AnimatedNumber({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  })
  const display = useTransform(springValue, (latest) =>
    `${prefix}${Number(latest).toFixed(decimals)}${suffix}`,
  )

  const prevValue = useRef(0)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: duration / 1000,
      ease: 'easeOut',
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value, duration, motionValue])

  return <motion.span className="tabular-nums">{display}</motion.span>
}

/**
 * Hook to get an animated numeric motion value.
 * Returns the formatted string value and the raw spring motion value.
 */
export function useAnimatedValue(
  value: number,
  options: { duration?: number; prefix?: string; suffix?: string; decimals?: number } = {},
) {
  const { duration = 1000, prefix = '', suffix = '', decimals = 0 } = options

  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  })
  const display = useTransform(springValue, (latest) =>
    `${prefix}${Number(latest).toFixed(decimals)}${suffix}`,
  )

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: duration / 1000,
      ease: 'easeOut',
    })
    return () => controls.stop()
  }, [value, duration, motionValue])

  return { display, springValue, motionValue }
}

export default AnimatedNumber
