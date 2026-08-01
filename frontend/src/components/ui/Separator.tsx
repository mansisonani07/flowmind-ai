import { cn } from '@/lib/utils'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  className?: string
  label?: string
}

export default function Separator({
  orientation = 'horizontal',
  decorative = true,
  className,
  label,
}: SeparatorProps) {
  if (label) {
    return (
      <div
        className={cn('flex items-center gap-3', className)}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={orientation}
      >
        <div className={cn(
          'flex-1 bg-gray-200 dark:bg-gray-700',
          orientation === 'horizontal' ? 'h-px' : 'w-px self-stretch',
        )} />
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
          {label}
        </span>
        <div className={cn(
          'flex-1 bg-gray-200 dark:bg-gray-700',
          orientation === 'horizontal' ? 'h-px' : 'w-px self-stretch',
        )} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch',
        className,
      )}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={orientation}
    />
  )
}
