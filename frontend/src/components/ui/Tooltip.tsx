import { useState, type ReactNode, type HTMLAttributes } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  placement?: TooltipPlacement
  delay?: number
  disabled?: boolean
  className?: string
  triggerProps?: HTMLAttributes<HTMLDivElement>
}

const placementStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowStyles: Record<TooltipPlacement, string> = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100',
}

export default function Tooltip({
  children,
  content,
  placement = 'top',
  delay = 200,
  disabled = false,
  className,
  triggerProps,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  let timeout: ReturnType<typeof setTimeout> | null = null

  const show = () => {
    if (disabled) return
    timeout = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    if (timeout) clearTimeout(timeout)
    setVisible(false)
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      {...triggerProps}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 pointer-events-none',
              placementStyles[placement],
              className,
            )}
            role="tooltip"
          >
            <div className="px-3 py-1.5 text-xs font-medium text-white dark:text-gray-900 bg-gray-900 dark:bg-gray-100 rounded-lg shadow-lg whitespace-nowrap">
              {content}
            </div>
            <div
              className={cn('absolute w-0 h-0 border-4 border-transparent', arrowStyles[placement])}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
