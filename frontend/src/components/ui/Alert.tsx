import { useState } from 'react'
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

type AlertType = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  type?: AlertType
  title?: string
  children: ReactNode
  dismissible?: boolean
  icon?: ReactNode
  className?: string
  action?: {
    label: string
    onClick: () => void
  }
  onDismiss?: () => void
}

const typeStyles: Record<AlertType, string> = {
  info: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700 text-gray-800 dark:text-gray-200',
  success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 text-amber-800 dark:text-amber-200',
  error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 text-red-800 dark:text-red-200',
}

const defaultIcons: Record<AlertType, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

const iconColors: Record<AlertType, string> = {
  info: 'text-gray-500 dark:text-gray-400',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
}

export default function Alert({
  type = 'info',
  title,
  children,
  dismissible = false,
  icon,
  className,
  action,
  onDismiss,
}: AlertProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  const Icon = icon ? undefined : defaultIcons[type]
  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border',
        typeStyles[type],
        className,
      )}
      role="alert"
    >
      {Icon && <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColors[type])} />}
      {!Icon && icon && <span className="shrink-0 mt-0.5">{icon}</span>}
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold">{title}</p>}
        <div className="text-sm mt-0.5">{children}</div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline underline-offset-2 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
