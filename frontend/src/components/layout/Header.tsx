import { Bell, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '@/components/ThemeToggle'

interface HeaderProps {
  title: string
  onMenuClick: () => void
  onCommandOpen?: () => void
  notificationCount?: number
}

export default function Header({ title, onMenuClick, onCommandOpen: _onCommandOpen, notificationCount = 0 }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 sm:px-4 lg:px-6">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
        >
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-bold ml-0.5 sm:ml-1 shrink-0">
          FM
        </div>
      </div>
    </header>
  )
}