import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Filter, MessageSquare, Search } from 'lucide-react'
import { conversationsAPI } from '@/lib/api'
import ConversationCard from '@/components/dashboard/ConversationCard'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import { getPrefs, setPref } from '@/services/storage'
import { useDebounce } from '@/hooks/useDebounce'
import type { Conversation } from '@/types'

const dateFilters = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'All', value: 'all' },
]

const confFilters = [
  { label: 'All', value: 'all' },
  { label: 'High (>80%)', value: 'high' },
  { label: 'Medium (60-80%)', value: 'medium' },
  { label: 'Low (<60%)', value: 'low' },
]

export default function Conversations() {
  const [dateFilter, setDateFilter] = useState(() => getPrefs().convDateFilter || 'all')
  const [confFilter, setConfFilter] = useState(() => getPrefs().convConfFilter || 'all')
  const [escalatedOnly, setEscalatedOnly] = useState(false)
  const [limit, setLimit] = useState(20)
  const [searchTerm, setSearchTerm] = useState(() => getPrefs().convSearch || '')
  const debouncedSearch = useDebounce(searchTerm, 200)

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', limit],
    queryFn: () => conversationsAPI.list(limit).then(r => r.data),
  })

  const handleDateFilter = (v: string) => { setDateFilter(v); setPref('convDateFilter', v) }
  const handleConfFilter = (v: string) => { setConfFilter(v); setPref('convConfFilter', v) }
  const handleSearch = (v: string) => { setSearchTerm(v); setPref('convSearch', v) }

  const filtered = useMemo(() => (conversations as Conversation[]).filter((c: Conversation) => {
    if (escalatedOnly && !c.escalated) return false
    if (confFilter === 'high' && c.confidence < 0.8) return false
    if (confFilter === 'medium' && (c.confidence < 0.6 || c.confidence >= 0.8)) return false
    if (confFilter === 'low' && c.confidence >= 0.6) return false
    if (dateFilter === 'today') { const today = new Date().toDateString(); if (new Date(c.timestamp).toDateString() !== today) return false }
    if (dateFilter === '7d') { const week = Date.now() - 7 * 86400000; if (new Date(c.timestamp).getTime() < week) return false }
    if (dateFilter === '30d') { const month = Date.now() - 30 * 86400000; if (new Date(c.timestamp).getTime() < month) return false }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!c.question.toLowerCase().includes(q) && !c.answer.toLowerCase().includes(q)) return false
    }
    return true
  }), [conversations, escalatedOnly, confFilter, dateFilter, debouncedSearch])

  if (isLoading) return <Loading text="Loading conversations..." className="h-96" />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversations</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Browse query history and responses</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search in questions and answers..."
          value={searchTerm}
          onChange={e => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          aria-label="Search conversations"
        />
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
        <div className="flex items-center gap-1.5"><Filter className="w-4 h-4 text-gray-400" />
          {dateFilters.map(f => (
            <button key={f.value} onClick={() => handleDateFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${dateFilter === f.value ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{f.label}</button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
        {confFilters.map(f => (
          <button key={f.value} onClick={() => handleConfFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${confFilter === f.value ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{f.label}</button>
        ))}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
        <button onClick={() => setEscalatedOnly(!escalatedOnly)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${escalatedOnly ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Escalated only</button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No conversations found</p>
          <p className="text-sm mt-1">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <motion.div initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }} className="space-y-3">
          {filtered.map((c: Conversation, i: number) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <ConversationCard conversation={c} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {conversations.length >= limit && (
        <div className="flex justify-center"><Button variant="secondary" onClick={() => setLimit(l => l + 20)}>Load More</Button></div>
      )}
    </div>
  )
}