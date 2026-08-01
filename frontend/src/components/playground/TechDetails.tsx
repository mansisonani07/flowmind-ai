'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  FileSearch,
  Boxes,
  Timer,
  Clock,
  Target,
  Zap,
  Layers,
} from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import Collapse from '@/components/ui/Collapse'
import ProgressBar from '@/components/ui/ProgressBar'
import type { ChatMessage } from '@/types'

interface TechDetailsProps {
  message: ChatMessage
  visible: boolean
}

function similarityBg(sim: number): string {
  if (sim >= 0.8) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (sim >= 0.6) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

function TimingBar({ label, ms, maxMs }: { label: string; ms: number; maxMs: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-28 shrink-0">{label}</span>
      <div className="flex-1">
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (ms / maxMs) * 100)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className={cn(
              'h-full rounded-full',
              ms > maxMs * 0.7
                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                : ms > maxMs * 0.4
                  ? 'bg-gradient-to-r from-indigo-400 to-indigo-500'
                  : 'bg-gradient-to-r from-emerald-400 to-emerald-500',
            )}
          />
        </div>
      </div>
      <span className="text-xs font-mono text-gray-600 dark:text-gray-300 w-16 text-right shrink-0">
        {formatTime(ms)}
      </span>
    </div>
  )
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  )
}

export default function TechDetails({ message, visible }: TechDetailsProps) {
  if (!visible || message.role !== 'assistant') return null

  const tech = message.technical
  const chunks = message.chunksRetrieved
  const hasTechnicalData = tech || chunks

  if (!hasTechnicalData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 text-center text-xs text-gray-400 dark:text-gray-500"
      >
        No technical details available for this response.
      </motion.div>
    )
  }

  // Calculate max timing for bar visualization
  const totalMs = message.responseTime || 0
  const maxTimingMs = Math.max(
    tech?.embeddingTimeMs || 0,
    tech?.retrievalTimeMs || 0,
    tech?.generationTimeMs || 0,
    100,
  )

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-3 p-1"
        >
          {/* Response Metrics */}
          <Collapse
            title="Response Metrics"
            subtitle="Confidence, timing, and token usage"
            icon={<BarChart3 className="w-4 h-4" />}
            defaultOpen={true}
            className="glass rounded-xl bg-white/40 dark:bg-gray-800/40"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <MetricCard
                icon={<Clock className="w-4 h-4" />}
                label="Response Time"
                value={message.responseTime ? formatTime(message.responseTime) : 'N/A'}
                sub="End-to-end"
              />
              <MetricCard
                icon={<Target className="w-4 h-4" />}
                label="Confidence"
                value={message.confidence != null ? `${Math.round(message.confidence * 100)}%` : 'N/A'}
                sub={message.confidence != null ? (message.confidence >= 0.8 ? 'High' : message.confidence >= 0.6 ? 'Medium' : 'Low') : undefined}
              />
              <MetricCard
                icon={<Zap className="w-4 h-4" />}
                label="Tokens Used"
                value={message.tokensUsed != null ? message.tokensUsed.toLocaleString() : 'N/A'}
                sub={message.tokensUsed != null ? 'Generation tokens' : undefined}
              />
            </div>
          </Collapse>

          {/* Retrieved Chunks */}
          {chunks && chunks.length > 0 && (
            <Collapse
              title={`Retrieved Chunks (${chunks.length})`}
              subtitle="Similarity scores and sources"
              icon={<FileSearch className="w-4 h-4" />}
              defaultOpen={false}
              className="glass rounded-xl bg-white/40 dark:bg-gray-800/40"
            >
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {chunks.map((chunk, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                          {chunk.filename}
                        </span>
                        {chunk.page != null && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">p.{chunk.page}</span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
                          similarityBg(chunk.similarity),
                        )}
                      >
                        {(chunk.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {chunk.text}
                    </p>
                    <div className="mt-1.5">
                      <ProgressBar value={chunk.similarity} max={1} size="sm" animated={false} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </Collapse>
          )}

          {/* Embedding Info */}
          {tech && (
            <Collapse
              title="Embedding Info"
              subtitle="Vector embedding details"
              icon={<Layers className="w-4 h-4" />}
              defaultOpen={false}
              className="glass rounded-xl bg-white/40 dark:bg-gray-800/40"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <MetricCard
                  icon={<Boxes className="w-4 h-4" />}
                  label="Dimensions"
                  value={tech.embeddingDimensions.toString()}
                  sub="Vector size"
                />
                <MetricCard
                  icon={<Timer className="w-4 h-4" />}
                  label="Embedding Time"
                  value={formatTime(tech.embeddingTimeMs)}
                  sub="Computation time"
                />
              </div>
            </Collapse>
          )}

          {/* Timing Breakdown */}
          {tech && (
            <Collapse
              title="Timing Breakdown"
              subtitle={`Total: ${formatTime(totalMs)}`}
              icon={<Timer className="w-4 h-4" />}
              defaultOpen={true}
              className="glass rounded-xl bg-white/40 dark:bg-gray-800/40"
            >
              <div className="space-y-3">
                <TimingBar label="Embedding" ms={tech.embeddingTimeMs} maxMs={maxTimingMs} />
                <TimingBar label="Retrieval" ms={tech.retrievalTimeMs} maxMs={maxTimingMs} />
                <TimingBar label="Generation" ms={tech.generationTimeMs} maxMs={maxTimingMs} />

                {/* Total bar */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Total</span>
                    <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {formatTime(totalMs)}
                    </span>
                  </div>
                  <div className="mt-1 w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500"
                    />
                  </div>
                </div>
              </div>
            </Collapse>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
