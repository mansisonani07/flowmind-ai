'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Trash2,
  FileJson,
  FileText,
  PanelRightOpen,
  PanelRightClose,
  Volume2,
  VolumeX,
  Activity,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQueryPlayground } from '@/hooks/useQueryPlayground'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useToast } from '@/context/ToastContext'
import ChatInterface from '@/components/playground/ChatInterface'
import TechDetails from '@/components/playground/TechDetails'
import SampleQuestions from '@/components/playground/SampleQuestions'
import Tooltip from '@/components/ui/Tooltip'
import { DEMO_MODE } from '@/lib/api'
import type { ChatMessage, PlaygroundQueryResponse } from '@/types'

const STORAGE_KEY = 'flowmind-playground-messages'

export default function Playground() {
  const [messages, setMessages] = useLocalStorage<ChatMessage[]>(STORAGE_KEY, [])
  const [showTechPanel, setShowTechPanel] = useState(() => window.innerWidth >= 1024)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toast = useToast()
  const { mutate: ask, isPending: isSending } = useQueryPlayground()

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.1, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch {
      // Audio not supported
    }
  }, [soundEnabled])

  const handleSend = useCallback(
    (question: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: question,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, userMsg])

      ask(
        { question },
        {
          onSuccess: (data: PlaygroundQueryResponse) => {
            playNotificationSound()
            const aiMsg: ChatMessage = {
              id: `ai-${Date.now()}`,
              role: 'assistant',
              content: data.answer,
              timestamp: Date.now(),
              responseTime: data.response_time_ms,
              confidence: data.confidence,
              sources: data.sources,
              tokensUsed: data.tokens_used,
              chunksRetrieved: data.chunks_retrieved,
              technical: {
                embeddingDimensions: data.embedding_dimensions,
                embeddingTimeMs: data.embedding_time_ms,
                retrievalTimeMs: data.retrieval_time_ms,
                generationTimeMs: data.generation_time_ms,
              },
            }
            setMessages((prev) => [...prev, aiMsg])
          },
          onError: (error) => {
            const errMsg: ChatMessage = {
              id: `error-${Date.now()}`,
              role: 'assistant',
              content: `Sorry, something went wrong: ${error.message || 'Unknown error'}. Please try again.`,
              timestamp: Date.now(),
              confidence: 0,
            }
            setMessages((prev) => [...prev, errMsg])
            toast.error('Query failed', error.message)
          },
        },
      )
    },
    [ask, setMessages, playNotificationSound, toast],
  )

  const handleClearChat = useCallback(() => {
    setMessages([])
    toast.info('Chat cleared', 'All messages have been removed.')
  }, [setMessages, toast])

  const exportJSON = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages.map(({ id, role, content, timestamp, responseTime, confidence, sources, tokensUsed }) => ({
        id, role, content,
        timestamp: new Date(timestamp).toISOString(),
        responseTime, confidence, sources, tokensUsed,
      })),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `playground-chat-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Exported', 'Chat exported as JSON file.')
  }, [messages, toast])

  const exportPDF = useCallback(() => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Export failed', 'Please allow popups for PDF export.')
      return
    }
    const html = `<!DOCTYPE html><html><head><title>Playground Chat Export</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;color:#1a1a1a}h1{font-size:24px;margin-bottom:4px}.meta{color:#666;font-size:13px;margin-bottom:24px}.msg{margin-bottom:16px;padding:12px 16px;border-radius:12px;max-width:85%}.msg.user{background:#6366f1;color:white;margin-left:auto}.msg.assistant{background:#f3f4f6;color:#1a1a1a}.msg-role{font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;opacity:.7}.msg-time{font-size:10px;opacity:.5;margin-top:4px}.msg-meta{font-size:11px;opacity:.6;margin-top:4px}</style></head><body><h1>AI Playground - Chat Export</h1><p class="meta">Exported: ${new Date().toLocaleString()} | ${messages.length} messages</p><hr style="margin-bottom:24px;border:none;border-top:1px solid #e5e7eb">${messages.map(m => `<div class="msg ${m.role}"><div class="msg-role">${m.role === 'user' ? 'You' : 'AI'}</div><div>${m.content}</div><div class="msg-time">${new Date(m.timestamp).toLocaleString()}</div>${m.confidence != null ? `<div class="msg-meta">Confidence: ${Math.round(m.confidence * 100)}%</div>` : ''}${m.responseTime != null ? `<div class="msg-meta">Response time: ${(m.responseTime / 1000).toFixed(1)}s</div>` : ''}</div>`).join('')}</body></html>`
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
    toast.success('Exported', 'PDF print dialog opened.')
  }, [messages, toast])

  const lastAIMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === 'assistant') || null,
    [messages],
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              AI Playground
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </h1>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
              {DEMO_MODE ? (
                <><Zap className="w-3 h-3" />Demo Mode</>
              ) : (
                <><Activity className="w-3 h-3" />Live</>
              )}
              <span className="mx-1">·</span>
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Tooltip content="Export as JSON" placement="bottom">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportJSON}
              disabled={messages.length === 0}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer', 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800', messages.length === 0 && 'opacity-40 cursor-not-allowed')}
            >
              <FileJson className="w-3.5 h-3.5" /><span className="hidden sm:inline">JSON</span>
            </motion.button>
          </Tooltip>

          <Tooltip content="Export as PDF" placement="bottom">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportPDF}
              disabled={messages.length === 0}
              className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer', 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800', messages.length === 0 && 'opacity-40 cursor-not-allowed')}
            >
              <FileText className="w-3.5 h-3.5" /><span className="hidden sm:inline">PDF</span>
            </motion.button>
          </Tooltip>

          <Tooltip content={soundEnabled ? 'Mute sounds' : 'Enable sounds'} placement="bottom">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn('flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer', soundEnabled ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-300 dark:text-gray-600')}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </motion.button>
          </Tooltip>

          <Tooltip content={showTechPanel ? 'Hide details panel' : 'Show details panel'} placement="bottom">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowTechPanel(!showTechPanel)}
              className={cn('flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer', showTechPanel ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}
            >
              {showTechPanel ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </motion.button>
          </Tooltip>

          <Tooltip content="Clear chat" placement="bottom">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClearChat}
              disabled={messages.length === 0}
              className={cn('flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer', 'text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500', messages.length === 0 && 'opacity-40 cursor-not-allowed')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </Tooltip>
        </div>
      </header>

      {/* Main content - hide tech panel on mobile by default */}
      <div className="flex-1 flex overflow-hidden">
        <div className={cn('flex flex-col min-w-0', showTechPanel ? 'w-[60%] lg:w-[60%]' : 'w-full')}>
          <ChatInterface messages={messages} isSending={isSending} onSend={handleSend} className="flex-1 min-h-0" />
          {messages.length === 0 && (
            <div className="flex-shrink-0 px-3 sm:px-4 pb-3 sm:pb-4">
              <SampleQuestions onQuestion={handleSend} disabled={isSending} className="glass rounded-2xl bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4" />
            </div>
          )}
        </div>

        {/* Tech panel - hidden on mobile/tablet */}
        <AnimatePresence initial={false}>
          {showTechPanel && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }} animate={{ width: '40%', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="hidden lg:flex flex-shrink-0 overflow-hidden border-l border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm"
            >
              <div className="h-full overflow-y-auto scrollbar-thin p-4 w-[calc(100%-8px)]">
                {lastAIMessage ? (
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-indigo-500" /> Technical Details
                    </h3>
                    <TechDetails message={lastAIMessage} visible={showTechPanel} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Send a message to see technical details like response metrics, retrieved chunks, and timing breakdown.
                    </p>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}