import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { addNotification } from '@/services/storage'

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  const handleToggle = () => {
    const newDark = !isDark
    toggleTheme()
    addNotification({
      id: `n-${Date.now()}`, type: 'system',
      title: 'Theme Updated',
      message: `Switched to ${newDark ? 'dark' : 'light'} mode.`,
      timestamp: new Date().toISOString(), read: false, priority: 'info',
    })
  }

  return (
    <button
      onClick={handleToggle}
      className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0, opacity: isDark ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Sun className="w-5 h-5 text-amber-500" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : -180, opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center"
      >
        <Moon className="w-5 h-5 text-indigo-400" />
      </motion.div>
    </button>
  )
}
