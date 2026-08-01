import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, CheckCheck, MessageSquare, AlertTriangle,
  FileText, Settings, Filter, Search,
} from 'lucide-react'
import type { Notification } from '@/types'
import NotificationItem from '@/components/notifications/NotificationItem'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Card from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import { getAllNotifications, markNotifRead } from '@/services/storage'
import { getPrefs, setPref } from '@/services/storage'
import { useDebounce } from '@/hooks/useDebounce'

type FilterTab = 'all' | 'conversation' | 'escalation' | 'document' | 'system'

const tabs: { key: FilterTab; label: string; icon: typeof Bell }[] = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'conversation', label: 'Conversations', icon: MessageSquare },
  { key: 'escalation', label: 'Escalations', icon: AlertTriangle },
  { key: 'document', label: 'Documents', icon: FileText },
  { key: 'system', label: 'System', icon: Settings },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterTab>(() => getPrefs().notifTypeFilter as FilterTab || 'all')
  const [searchTerm, setSearchTerm] = useState(() => getPrefs().notifSearch || '')
  const debouncedSearch = useDebounce(searchTerm, 200)

  const fetchNotifications = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const allNotifs = getAllNotifications().map(n => ({
        id: n.id, type: n.type as Notification['type'],
        title: n.title, message: n.message,
        read: n.read, created_at: n.timestamp,
      }))
      setNotifications(allNotifs)
      setLoading(false)
    }, 300)
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  // Auto-refresh every 10s for new notifications
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const handleFilterChange = (tab: FilterTab) => {
    setActiveFilter(tab)
    setPref('notifTypeFilter', tab)
  }

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setPref('notifSearch', val)
  }

  const markAsRead = (id: string) => {
    markNotifRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const filtered = notifications
    .filter(n => activeFilter === 'all' || n.type === activeFilter)
    .filter(n => {
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q)
    })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 sm:space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Stay updated with your latest activity</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && <Badge variant="info">{unreadCount} unread</Badge>}
          <Button variant="secondary" size="sm" iconLeft={<CheckCheck className="w-4 h-4" />} onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div variants={item}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            aria-label="Search notifications"
          />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/60 rounded-xl w-full sm:w-fit overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon
            const count = tab.key === 'all' ? notifications.length : notifications.filter(n => n.type === tab.key).length
            return (
              <button key={tab.key} onClick={() => handleFilterChange(tab.key)}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap',
                  activeFilter === tab.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300')}>
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={cn('text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1',
                    activeFilter === tab.key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400')}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          header={<div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">{tabs.find(t => t.key === activeFilter)?.label || 'All'} Notifications</h3>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} items</span>
          </div>}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Loading notifications...</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<BellOff className="w-12 h-12" />}
              title={searchTerm ? 'No matching notifications' : activeFilter === 'all' ? 'No notifications yet' : `No ${tabs.find(t => t.key === activeFilter)?.label.toLowerCase()} notifications`}
              description={searchTerm ? 'Try a different search term.' : activeFilter === 'all' ? "When things happen, you'll see them here." : 'Nothing to show for this category.'} />
          ) : (
            <div className="divide-y divide-gray-100/80 dark:divide-gray-800/60 max-h-[600px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {filtered.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} onMarkRead={markAsRead} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
