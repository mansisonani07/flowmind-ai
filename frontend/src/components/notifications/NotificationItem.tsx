import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  AlertTriangle,
  FileText,
  Bell,
  BarChart3,
} from 'lucide-react'
import type { Notification } from '@/types'
import { cn } from '@/lib/utils'

const iconMap: Record<Notification['type'], typeof MessageSquare> = {
  conversation: MessageSquare,
  escalation: AlertTriangle,
  document: FileText,
  system: Bell,
  summary: BarChart3,
}

const iconColorMap: Record<Notification['type'], string> = {
  conversation: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  escalation: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  document: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  system: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  summary: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
}

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
}

export default function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const Icon = iconMap[notification.type] || Bell
  const isUnread = !notification.read

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => isUnread && onMarkRead(notification.id)}
      className={cn(
        'relative flex items-start gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors',
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        isUnread ? 'border-l-2 border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-l-2 border-transparent opacity-70',
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') isUnread && onMarkRead(notification.id) }}
      aria-label={notification.title}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-500" />
      )}

      {/* Icon */}
      <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', iconColorMap[notification.type])}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm leading-snug truncate',
            isUnread ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300',
          )}>
            {notification.title}
          </p>
        </div>
        <p className={cn(
          'text-xs mt-0.5 line-clamp-2',
          isUnread ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500',
        )}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  )
}
