import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, FileText, MessageSquare, BarChart3, Play, DollarSign, Bell, Settings, Palette, Upload, Plus, TrendingUp, Download, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandItem {
  id: string
  label: string
  icon: typeof Home
  shortcut?: string
  action: () => void
  group: string
}

const STORAGE_KEY = 'flowmind_recent_searches'

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return
  const searches = getRecentSearches()
  const filtered = searches.filter((s) => s !== query)
  filtered.unshift(query)
  const trimmed = filtered.slice(0, 3)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const listRef = useRef<HTMLDivElement>(null)

  const runAction = useCallback(
    (action: () => void, label?: string) => {
      action()
      if (label) saveRecentSearch(label)
      onClose()
    },
    [onClose],
  )

  const commands = useMemo<CommandItem[]>(
    () => [
      // Pages
      { id: 'page-home', label: 'Home', icon: Home, shortcut: '⌘ H', action: () => navigate('/'), group: 'Pages' },
      { id: 'page-documents', label: 'Documents', icon: FileText, shortcut: '⌘ D', action: () => navigate('/documents'), group: 'Pages' },
      { id: 'page-conversations', label: 'Conversations', icon: MessageSquare, shortcut: '⌘ C', action: () => navigate('/conversations'), group: 'Pages' },
      { id: 'page-analytics', label: 'Analytics', icon: BarChart3, shortcut: '⌘ A', action: () => navigate('/analytics'), group: 'Pages' },
      { id: 'page-playground', label: 'Playground', icon: Play, shortcut: '⌘ P', action: () => navigate('/playground'), group: 'Pages' },
      { id: 'page-costs', label: 'Costs', icon: DollarSign, shortcut: '⌘ $', action: () => navigate('/costs'), group: 'Pages' },
      { id: 'page-notifications', label: 'Notifications', icon: Bell, shortcut: '⌘ N', action: () => navigate('/notifications'), group: 'Pages' },
      { id: 'page-settings', label: 'Settings', icon: Settings, shortcut: '⌘ ,', action: () => navigate('/settings'), group: 'Pages' },
      { id: 'page-theme', label: 'Theme', icon: Palette, shortcut: '⌘ T', action: () => navigate('/settings/theme'), group: 'Pages' },
      // Actions
      { id: 'action-upload', label: 'Upload PDF', icon: Upload, shortcut: '⌘ U', action: () => navigate('/documents', { state: { upload: true } }), group: 'Actions' },
      { id: 'action-new-chat', label: 'New Chat', icon: Plus, action: () => navigate('/playground'), group: 'Actions' },
      { id: 'action-view-analytics', label: 'View Analytics', icon: TrendingUp, action: () => navigate('/analytics'), group: 'Actions' },
      { id: 'action-export', label: 'Export Report', icon: Download, action: () => navigate('/analytics', { state: { export: true } }), group: 'Actions' },
    ],
    [navigate],
  )

  const recentSearches = useMemo(() => {
    const recent = getRecentSearches()
    return recent.map(
      (search): CommandItem => ({
        id: `recent-${search}`,
        label: search,
        icon: Clock,
        action: () => {
          // Find matching command if exists, otherwise just close
          const match = commands.find((c) => c.label.toLowerCase() === search.toLowerCase())
          if (match) {
            match.action()
          }
        },
        group: 'Recent',
      }),
    )
  }, [commands])

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      const groups: CommandItem[][] = []
      if (recentSearches.length > 0) groups.push(recentSearches)
      groups.push(commands.filter((c) => c.group === 'Pages'))
      groups.push(commands.filter((c) => c.group === 'Actions'))
      return groups
    }

    const q = query.toLowerCase()
    const all = [...commands, ...recentSearches]
    const filtered = all.filter((c) => c.label.toLowerCase().includes(q))

    const grouped = new Map<string, CommandItem[]>()
    const order = ['Recent', 'Pages', 'Actions']
    for (const item of filtered) {
      const group = item.group
      if (!grouped.has(group)) grouped.set(group, [])
      grouped.get(group)!.push(item)
    }

    return order.filter((g) => grouped.has(g)).map((g) => grouped.get(g)!)
  }, [query, commands, recentSearches])

  const flatItems = useMemo(() => filteredCommands.flat(), [filteredCommands])

  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % flatItems.length)
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length)
        return
      }

      if (e.key === 'Enter' && flatItems[selectedIndex]) {
        e.preventDefault()
        const item = flatItems[selectedIndex]
        runAction(item.action, item.group === 'Recent' ? undefined : item.label)
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Auto-focus the input
    requestAnimationFrame(() => inputRef.current?.focus())

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flatItems, selectedIndex, onClose, runAction])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const selected = listRef.current.querySelector('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleSelect = useCallback(
    (item: CommandItem) => {
      runAction(item.action, item.group === 'Recent' ? undefined : item.label)
    },
    [runAction],
  )

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl"
          >
            {/* Glass card container */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
                <Search className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div
                ref={listRef}
                className="max-h-80 overflow-y-auto py-2 custom-scrollbar"
                role="listbox"
              >
                {filteredCommands.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">No results found.</p>
                  </div>
                )}

                {filteredCommands.map((group, groupIdx) => (
                  <div key={group[0]?.group || groupIdx}>
                    {/* Group header */}
                    <div className="px-4 pt-2 pb-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {group[0]?.group}
                      </p>
                    </div>

                    {/* Group items */}
                    {group.map((item) => {
                      const globalIdx = flatItems.indexOf(item)
                      const isSelected = globalIdx === selectedIndex
                      const Icon = item.icon

                      return (
                        <button
                          key={item.id}
                          data-selected={isSelected}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={cn(
                            'flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors cursor-pointer',
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-100'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                          )}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0',
                              isSelected
                                ? 'text-indigo-500'
                                : 'text-gray-400 dark:text-gray-500',
                            )}
                          />
                          <span className="flex-1 text-sm font-medium truncate">{item.label}</span>
                          {item.shortcut && (
                            <span
                              className={cn(
                                'text-[11px] font-medium px-1.5 py-0.5 rounded border',
                                isSelected
                                  ? 'text-indigo-400 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800'
                                  : 'text-gray-400 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
                              )}
                            >
                              {item.shortcut}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                  <kbd className="px-1 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                  <kbd className="px-1 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    ↵
                  </kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                  <kbd className="px-1 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    esc
                  </kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
