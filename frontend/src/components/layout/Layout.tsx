import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { getPrefs, setPref, getAllNotifications } from '@/services/storage'
import { startPeriodicNotifications } from '@/services/storage'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/playground': 'AI Playground',
  '/documents': 'Documents',
  '/conversations': 'Conversations',
  '/analytics': 'Analytics',
  '/costs': 'Cost Tracking',
  '/notifications': 'Notifications',
  '/business-settings': 'Business Settings',
  '/theme': 'Theme Customizer',
  '/settings': 'Settings',
}

export default function Layout({ onCommandOpen }: { onCommandOpen?: () => void }) {
  const [collapsed, setCollapsed] = useState(() => getPrefs().sidebarCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Dashboard'

  // Save last visited page
  useEffect(() => { setPref('lastPage', location.pathname) }, [location.pathname])

  // Persist sidebar state
  const handleToggle = useCallback(() => {
    setCollapsed(prev => { setPref('sidebarCollapsed', !prev); return !prev })
  }, [])

  // Refresh notification count
  const refreshNotifCount = useCallback(() => {
    setNotifCount(getAllNotifications().filter(n => !n.read).length)
  }, [])

  useEffect(() => { refreshNotifCount() }, [refreshNotifCount, location])

  // Start periodic notifications and refresh interval
  useEffect(() => {
    const stopPeriodic = startPeriodicNotifications()
    const interval = setInterval(refreshNotifCount, 15000)
    return () => { stopPeriodic(); clearInterval(interval) }
  }, [refreshNotifCount])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header title={title} onMenuClick={() => setMobileOpen(true)} onCommandOpen={onCommandOpen} notificationCount={notifCount} />
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6"><Outlet /></div>
      </main>
    </div>
  )
}