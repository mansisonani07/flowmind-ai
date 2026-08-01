import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Loading from './components/ui/Loading'
import { ToastProvider } from './context/ToastContext'
import { WebSocketProvider } from './context/WebSocketContext'
import { NotificationProvider } from './context/NotificationContext'
import OnboardingWizard from './components/onboarding/OnboardingWizard'
import CommandPalette from './components/ui/CommandPalette'
import { useState, useEffect } from 'react'

const Home = lazy(() => import('./pages/Home'))
const Documents = lazy(() => import('./pages/Documents'))
const Conversations = lazy(() => import('./pages/Conversations'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))
const Playground = lazy(() => import('./pages/Playground'))
const Costs = lazy(() => import('./pages/Costs'))
const Notifications = lazy(() => import('./pages/Notifications'))
const BusinessSettings = lazy(() => import('./pages/BusinessSettings'))
const ThemeCustomizer = lazy(() => import('./pages/ThemeCustomizer'))

export default function App() {
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
      if (e.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <WebSocketProvider url="ws://localhost:8000/ws" autoConnect={false}>
      <NotificationProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            <OnboardingWizard />
            <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loading size="lg" /></div>}>
              <Routes>
                <Route element={<Layout onCommandOpen={() => setCommandOpen(true)} />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/documents" element={<Documents />} />
                  <Route path="/conversations" element={<Conversations />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/playground" element={<Playground />} />
                  <Route path="/costs" element={<Costs />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/business-settings" element={<BusinessSettings />} />
                  <Route path="/theme" element={<ThemeCustomizer />} />
                </Route>
              </Routes>
            </Suspense>
          </div>
        </ToastProvider>
      </NotificationProvider>
    </WebSocketProvider>
  )
}