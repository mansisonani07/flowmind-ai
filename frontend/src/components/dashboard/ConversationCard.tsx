import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn, getConfidenceBg, timeAgo } from '@/lib/utils'
import type { Conversation } from '@/types'

interface ConversationCardProps {
  conversation: Conversation
}

export default function ConversationCard({ conversation }: ConversationCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { question, answer, confidence, sources, escalated, timestamp, response_time_ms } = conversation

  return (
    <motion.div layout className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 flex items-start gap-3 cursor-pointer">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 dark:text-white truncate">{question}</p>
            {escalated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Escalated
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', getConfidenceBg(confidence))}>
              {(confidence * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-400">{timeAgo(timestamp)}</span>
            <span className="text-xs text-gray-400">{response_time_ms}ms</span>
          </div>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
        </motion.div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Answer</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{answer}</p>
              </div>
              {sources.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((s, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 text-xs">
                        {s.filename} (p.{s.page})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
