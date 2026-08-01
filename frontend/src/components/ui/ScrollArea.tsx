import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
  maxHeight?: string
  type?: 'auto' | 'always' | 'scroll' | 'hover'
}

export default function ScrollArea({ children, className, maxHeight, type = 'auto' }: ScrollAreaProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        type === 'auto' && 'overflow-y-auto',
        type === 'always' && 'overflow-y-scroll',
        type === 'scroll' && 'overflow-y-scroll',
        type === 'hover' && 'overflow-y-auto [scrollbar-gutter:stable]',
        className,
      )}
      style={{ maxHeight }}
      data-scroll-area
    >
      {children}
    </div>
  )
}
