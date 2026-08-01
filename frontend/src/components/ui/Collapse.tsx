import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapseProps {
  title: ReactNode
  subtitle?: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: ReactNode
  className?: string
  contentClassName?: string
  disabled?: boolean
  onChange?: (open: boolean) => void
}

export default function Collapse({
  title,
  subtitle,
  children,
  defaultOpen = false,
  icon,
  className,
  contentClassName,
  disabled = false,
  onChange,
}: CollapseProps) {
  const [open, setOpen] = useState(defaultOpen)

  const toggle = () => {
    if (disabled) return
    const next = !open
    setOpen(next)
    onChange?.(next)
  }

  return (
    <div className={cn('border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden', disabled && 'opacity-50', className)}>
      <button
        onClick={toggle}
        className="flex items-center justify-between w-full px-4 py-3 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
        aria-expanded={open}
        disabled={disabled}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <span className="shrink-0 text-gray-400 dark:text-gray-500">{icon}</span>}
          <div className="min-w-0">
            <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{title}</span>
            {subtitle && (
              <span className="block text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{subtitle}</span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-3"
        >
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={cn('px-4 py-3 border-t border-gray-200 dark:border-gray-700', contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
