'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Send } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import VoiceInput from './VoiceInput'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  className?: string
}

const MAX_CHARS = 2000

export default function ChatInput({ onSend, disabled = false, className }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxH = 96 // ~4 lines at 24px line height
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    // Reset textarea height after clearing
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    })
  }, [value, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleTranscript = useCallback(
    (text: string) => {
      if (disabled) return
      // Append to current value
      setValue((prev) => {
        const next = prev ? `${prev} ${text}` : text
        if (next.length > MAX_CHARS) return prev
        return next
      })
    },
    [disabled],
  )

  const charPct = (value.length / MAX_CHARS) * 100

  return (
    <div
      className={cn(
        'glass rounded-2xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 p-3 transition-all',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= MAX_CHARS) setValue(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents..."
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
              'focus:outline-none',
              'scrollbar-thin',
              'max-h-24',
            )}
            aria-label="Chat message input"
          />
        </div>

        {/* Voice input */}
        <VoiceInput onTranscript={handleTranscript} disabled={disabled} />

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer',
            value.trim() && !disabled
              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed',
          )}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Character count */}
      <div className="flex justify-end mt-1.5">
        <span
          className={cn(
            'text-[10px] tabular-nums transition-colors',
            charPct > 90
              ? 'text-red-500'
              : charPct > 70
                ? 'text-amber-500'
                : 'text-gray-400 dark:text-gray-500',
          )}
        >
          {value.length}/{MAX_CHARS}
        </span>
      </div>
    </div>
  )
}
