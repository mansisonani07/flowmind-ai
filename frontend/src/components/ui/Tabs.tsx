import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
  badge?: string | number
  disabled?: boolean
}

interface TabsProps {
  items: TabItem[]
  defaultTab?: string
  variant?: 'underline' | 'pill'
  onChange?: (tabId: string) => void
  className?: string
  contentClassName?: string
  fullWidth?: boolean
}

export default function Tabs({
  items,
  defaultTab,
  variant = 'underline',
  onChange,
  className,
  contentClassName,
  fullWidth = false,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? items[0]?.id ?? '')

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    onChange?.(tabId)
  }

  const activeContent = items.find((item) => item.id === activeTab)?.content

  return (
    <div className={cn('flex flex-col', className)}>
      <div
        role="tablist"
        className={cn(
          variant === 'underline' && 'flex gap-1 border-b border-gray-200 dark:border-gray-700',
          variant === 'pill' && 'flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg',
        )}
      >
        {items.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={activeTab === item.id}
            disabled={item.disabled}
            onClick={() => !item.disabled && handleTabChange(item.id)}
            className={cn(
              'relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer',
              item.disabled && 'opacity-40 cursor-not-allowed',
              variant === 'underline' && [
                'border-b-2 -mb-px',
                activeTab === item.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600',
              ],
              variant === 'pill' && [
                'rounded-md',
                activeTab === item.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ],
              fullWidth && 'flex-1 justify-center',
            )}
          >
            {item.icon}
            {item.label}
            {item.badge !== undefined && (
              <span className={cn(
                'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
                activeTab === item.id
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
              )}>
                {item.badge}
              </span>
            )}
            {variant === 'underline' && activeTab === item.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={cn('mt-4', contentClassName)}>
        {activeContent}
      </div>
    </div>
  )
}
