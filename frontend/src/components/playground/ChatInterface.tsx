'use client'

import { useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import ChatBubble from './ChatBubble'
import ChatInput from './ChatInput'
import type { ChatMessage } from '@/types'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  isSending: boolean
  onSend: (message: string) => void
  className?: string
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1)
  const d2 = new Date(ts2)
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function getDateLabel(timestamp: number): string {
  const now = new Date()
  const date = new Date(timestamp)
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return 'Today'
  }
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate() - 1
  ) {
    return 'Yesterday'
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const typingDots = (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 typing-dot"
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          delay: i * 0.2,
        }}
      />
    ))}
  </div>
)

export default function ChatInterface({ messages, isSending, onSend, className }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isSending])

  // Group messages by date for separators
  const messagesWithSeparators = useMemo(() => {
    const result: Array<{ type: 'message' | 'separator'; message?: ChatMessage; label?: string }> = []
    messages.forEach((msg, idx) => {
      if (idx === 0 || !isSameDay(messages[idx - 1].timestamp, msg.timestamp)) {
        result.push({ type: 'separator', label: getDateLabel(msg.timestamp) })
      }
      result.push({ type: 'message', message: msg })
    })
    return result
  }, [messages])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-3"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Empty state */}
        {messages.length === 0 && !isSending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center px-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Welcome to AI Playground
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Ask questions about your uploaded documents. The AI will search through your knowledge base and provide accurate answers with sources.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Powered by RAG (Retrieval-Augmented Generation)</span>
            </div>
          </motion.div>
        )}

        {/* Messages with date separators */}
        <AnimatePresence initial={false}>
          {messagesWithSeparators.map((item, idx) => {
            if (item.type === 'separator') {
              return (
                <motion.div
                  key={`sep-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 my-4"
                >
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 px-2">
                    {item.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </motion.div>
              )
            }

            return (
              <motion.div key={item.message!.id}>
                <ChatBubble message={item.message!} />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2.5 mr-auto max-w-[85%]"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="glass bg-white/80 dark:bg-gray-800/80 rounded-2xl rounded-tl-md border border-gray-200/50 dark:border-gray-700/50">
              {typingDots}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="px-4 pb-4">
        <ChatInput onSend={onSend} disabled={isSending} />
      </div>
    </div>
  )
}
