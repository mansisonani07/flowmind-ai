import { cn } from '@/lib/utils'

interface LiveIndicatorProps {
  connected: boolean
  label?: string
}

export default function LiveIndicator({ connected, label }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={cn(
            'absolute inset-0 rounded-full',
            connected ? 'bg-emerald-400' : 'bg-gray-400 dark:bg-gray-600',
          )}
        />
        {connected && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        )}
        <span
          className={cn(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            connected ? 'bg-emerald-500' : 'bg-gray-400 dark:bg-gray-600',
          )}
        />
      </span>
      {label && (
        <span
          className={cn(
            'text-xs font-medium',
            connected
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-400 dark:text-gray-500',
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}
