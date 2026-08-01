import { cn } from '@/lib/utils'

interface GradientTextProps {
  children: React.ReactNode
  from?: string
  to?: string
  className?: string
  animated?: boolean
}

export default function GradientText({
  children,
  from = '#6366f1',
  to = '#8b5cf6',
  className,
  animated = true,
}: GradientTextProps) {
  return (
    <span
      className={cn(
        'inline-block bg-clip-text text-transparent',
        animated && 'animate-gradient-text',
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(to right, ${from}, ${to})`,
        ...(animated
          ? { backgroundSize: '200% auto' }
          : {}),
      }}
    >
      {children}
    </span>
  )
}
