import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ChipProps {
  label: string
  onRemove?: () => void
  icon?: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md'
  className?: string
  disabled?: boolean
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  primary: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  success: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
}

export default function Chip({
  label,
  onRemove,
  icon,
  variant = 'default',
  size = 'md',
  className,
  disabled = false,
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50',
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
      {onRemove && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="shrink-0 ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={`Remove ${label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}

interface ChipGroupProps {
  chips: { label: string; key: string; icon?: ReactNode; variant?: ChipProps['variant'] }[]
  onRemove?: (key: string) => void
  className?: string
  size?: ChipProps['size']
}

export function ChipGroup({ chips, onRemove, className, size }: ChipGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {chips.map((chip) => (
        <Chip
          key={chip.key}
          label={chip.label}
          icon={chip.icon}
          variant={chip.variant}
          size={size}
          onRemove={onRemove ? () => onRemove(chip.key) : undefined}
        />
      ))}
    </div>
  )
}
