import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  id?: string
}

export default function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
  id,
}: SwitchProps) {
  const switchId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const sizeClasses = {
    sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: checked ? 'translate-x-4' : 'translate-x-0.5' },
    md: { track: 'w-11 h-6', thumb: 'w-4.5 h-4.5', translate: checked ? 'translate-x-5' : 'translate-x-0.5' },
  }

  const s = sizeClasses[size]

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950',
          'focus:ring-gray-400/50',
          checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
          s.track,
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
            s.thumb,
            s.translate,
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label htmlFor={switchId} className={cn(
              'text-sm font-medium cursor-pointer',
              disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300',
            )}>
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}
