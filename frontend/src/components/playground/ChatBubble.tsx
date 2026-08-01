'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronDown, ChevronUp, Clock, FileText, Copy, Check } from 'lucide-react'
import { cn, formatTime, getConfidenceBg } from '@/lib/utils'
import type { ChatMessage } from '@/types'

interface ChatBubbleProps {
  message: ChatMessage
  onExport?: (message: ChatMessage) => void
}

function getRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const confidenceLabel = useMemo(() => {
    if (message.confidence == null) return null
    const pct = Math.round(message.confidence * 100)
    if (pct >= 80) return { text: `${pct}% confidence`, variant: 'success' as const }
    if (pct >= 60) return { text: `${pct}% confidence`, variant: 'warning' as const }
    return { text: `${pct}% confidence`, variant: 'danger' as const }
  }, [message.confidence])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex gap-2.5 max-w-[85%]', isUser ? 'ml-auto flex-row-reverse' : 'mr-auto')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-1',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white',
        )}
      >
        {isUser ? 'U' : <Brain className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1 min-w-0 max-w-full">
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tr-md'
              : 'glass bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 rounded-tl-md border border-gray-200/50 dark:border-gray-700/50',
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* AI metadata */}
        {!isUser && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ delay: 0.15, duration: 0.2 }}
            className="flex flex-wrap items-center gap-2 px-1"
          >
            {/* Timestamp */}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(message.timestamp)}
            </span>

            {/* Response time */}
            {message.responseTime != null && (
              <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                {formatTime(message.responseTime)}
              </span>
            )}

            {/* Confidence badge */}
            {confidenceLabel && (
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  getConfidenceBg(message.confidence!),
                )}
              >
                {confidenceLabel.text}
              </span>
            )}

            {/* Sources count */}
            {message.sources && message.sources.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
              >
                <FileText className="w-3 h-3" />
                {message.sources.length} source{message.sources.length > 1 ? 's' : ''}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </motion.div>
        )}

        {/* User timestamp */}
        {isUser && (
          <div className="flex items-center gap-1 px-1 justify-end">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* Expanded source details */}
        {!isUser && expanded && message.sources && message.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 px-1 space-y-1.5"
          >
            {message.sources.map((source, idx) => (
              <div
                key={idx}
                className="text-xs p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
                    {source.filename}
                  </span>
                  {source.page != null && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      p.{source.page}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-[11px]">
                  {source.text}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
