import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_MODE } from '@/lib/api'
import type { AIInsight } from '@/types'

const demoInsights: AIInsight[] = [
  { id: '1', type: 'trend', icon: 'TrendingUp', title: 'Query volume up 23%', description: 'Daily queries increased from 20 to 28 this week. Menu-related queries are driving the growth.', priority: 'medium', createdAt: new Date().toISOString() },
  { id: '2', type: 'alert', icon: 'AlertTriangle', title: 'Escalation rate spike', description: 'Escalations increased to 4.2% this week. Most are pricing-related queries with low confidence.', priority: 'high', createdAt: new Date().toISOString() },
  { id: '3', type: 'recommendation', icon: 'Lightbulb', title: 'Add pricing document', description: '42% of escalated queries relate to pricing. Uploading a dedicated pricing FAQ could reduce escalations by ~60%.', priority: 'high', action: 'upload', actionLabel: 'Upload Document', createdAt: new Date().toISOString() },
]

const typeConfig: Record<
  AIInsight['type'],
  { icon: typeof TrendingUp; borderColor: string; bgColor: string; textColor: string }
> = {
  trend: {
    icon: TrendingUp,
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    textColor: 'text-blue-500',
  },
  alert: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/10',
    textColor: 'text-amber-500',
  },
  recommendation: {
    icon: Lightbulb,
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
    textColor: 'text-emerald-500',
  },
}

function SkeletonLines() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded shimmer" />
            <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}

const listVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function AIInsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (DEMO_MODE) {
        await new Promise(r => setTimeout(r, 600))
        setInsights(demoInsights)
      } else {
        await new Promise(r => setTimeout(r, 600))
        setInsights(demoInsights)
      }
    } catch {
      setError('Could not generate insights')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return (
    <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">AI Insights</h3>
        </div>
        <button
          onClick={fetchInsights}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Refresh insights"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {loading && insights.length === 0 ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SkeletonLines />
            </motion.div>
          ) : error && insights.length === 0 ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{error}</p>
              <button
                onClick={fetchInsights}
                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry
              </button>
            </motion.div>
          ) : insights.length > 0 ? (
            <motion.div
              key="insights"
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar"
            >
              {insights.map((insight) => {
                const config = typeConfig[insight.type]
                const Icon = config.icon

                return (
                  <motion.div
                    key={insight.id}
                    variants={itemVariants}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border-l-[3px] transition-colors',
                      config.borderColor,
                      config.bgColor,
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                        config.bgColor,
                        config.textColor,
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {insight.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {insight.description}
                      </p>
                      {insight.action && insight.actionLabel && (
                        <button className="mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2.5 py-1 transition-colors cursor-pointer">
                          {insight.actionLabel}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <Lightbulb className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No insights available yet. Upload some documents and start querying to generate insights.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
