import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Clock,
  BarChart3,
  Activity,
  ArrowUpRight,
} from 'lucide-react'
import { differenceInDays, format, startOfDay, subDays } from 'date-fns'
import DateRangePicker from '@/components/analytics/DateRangePicker'
import ReportExporter from '@/components/analytics/ReportExporter'
import { sampleAnalytics } from '@/lib/api'
import { cn, getConfidenceBg, timeAgo } from '@/lib/utils'

interface DateRange {
  from: Date
  to: Date
}

interface TopQuestion {
  question: string
  count: number
  avg_confidence: number
  last_asked: string
}

interface StatsResponse {
  total_documents: number
  total_chunks: number
  total_queries: number
  avg_confidence: number
  escalation_rate: number
  popular_questions: TopQuestion[]
  daily_query_count: { date: string; count: number }[]
  avg_response_time: number
  confidence_distribution: { range: string; count: number }[]
  category_distribution: { name: string; value: number; color?: string }[]
  response_time_percentiles: { date: string; p50: number; p75: number; p95: number; p99: number }[]
}

const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const CONFIDENCE_COLORS: Record<string, string> = {
  '90-100%': '#10b981',
  '80-89%': '#06b6d4',
  '70-79%': '#f59e0b',
  '60-69%': '#f97316',
  'Below 60%': '#ef4444',
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-lg text-xs">
      {label && <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-700 dark:text-gray-300">
            {entry.name}: <span className="font-semibold text-gray-900 dark:text-white">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </span>
        </p>
      ))}
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', getConfidenceBg(confidence))}>
      {(confidence * 100).toFixed(0)}%
    </span>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [dateRange, setDateRange] = useState<DateRange>(() => ({
    from: startOfDay(subDays(new Date(), 29)),
    to: startOfDay(new Date()),
  }))

  const days = useMemo(
    () => Math.max(1, differenceInDays(dateRange.to, dateRange.from) + 1),
    [dateRange],
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    // Simulate loading delay for realistic feel
    await new Promise(r => setTimeout(r, 400))

    const data: StatsResponse = {
      total_documents: 3,
      total_chunks: 140,
      total_queries: sampleAnalytics.summary.total_queries,
      avg_confidence: sampleAnalytics.summary.avg_confidence / 100,
      escalation_rate: sampleAnalytics.summary.escalation_rate / 100,
      popular_questions: sampleAnalytics.top_questions.map(q => ({
        question: q.question,
        count: q.count,
        avg_confidence: q.avg_confidence,
        last_asked: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
      })),
      daily_query_count: sampleAnalytics.daily_queries.map(d => ({
        date: d.date,
        count: d.queries,
      })),
      avg_response_time: sampleAnalytics.summary.avg_response_ms,
      confidence_distribution: sampleAnalytics.confidence_distribution,
      category_distribution: sampleAnalytics.category_distribution,
      response_time_percentiles: sampleAnalytics.response_times,
    }
    setStats(data)
    setLoading(false)
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  const pieData = useMemo(
    () => stats?.category_distribution.map((c, i) => ({
      ...c,
      fill: c.color || PIE_COLORS[i % PIE_COLORS.length],
    })) ?? [],
    [stats],
  )

  const percentileData = stats?.response_time_percentiles ?? []

  const hasData = !!stats && (stats.total_queries > 0 || stats.daily_query_count.length > 0)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Performance insights and usage patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ReportExporter data={stats as unknown as Record<string, unknown>} dateRange={dateRange} />
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass rounded-xl p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                </div>
              </div>
              <div className="h-[260px] bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {!loading && hasData && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1) Query Volume */}
            <motion.div variants={item} className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Query Volume</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.daily_query_count}>
                  <defs>
                    <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#queryGrad)" name="Queries" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* 2) Confidence Distribution */}
            <motion.div variants={item} className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Confidence Distribution</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Response quality breakdown</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.confidence_distribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                  <YAxis type="category" dataKey="range" tick={{ fontSize: 11 }} stroke="#9ca3af" width={90} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={28} name="Queries">
                    {stats.confidence_distribution.map((entry) => (
                      <Cell key={entry.range} fill={CONFIDENCE_COLORS[entry.range] ?? '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* 3) Categories */}
            <motion.div variants={item} className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                  <PieChartIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Categories</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Query topic distribution</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={65} outerRadius={105} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value: string) => (
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{value}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* 4) Response Time */}
            <motion.div variants={item} className="glass rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Response Time</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Percentile trends (ms)</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={percentileData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb20" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v: number) => v + 'ms'} />
                  <Tooltip content={<ChartTooltip formatter={(v) => v + 'ms'} />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} dot={false} name="p50" />
                  <Line type="monotone" dataKey="p75" stroke="#f59e0b" strokeWidth={2} dot={false} name="p75" />
                  <Line type="monotone" dataKey="p95" stroke="#6366f1" strokeWidth={2} dot={false} name="p95" />
                  <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} name="p99" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Top Questions Table */}
          <motion.div variants={item} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Activity className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Questions</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Most frequently asked queries</p>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">#</th>
                    <th className="text-left py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Question</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Count</th>
                    <th className="text-center py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Avg Confidence</th>
                    <th className="text-right py-2.5 px-3 text-gray-500 font-medium text-xs uppercase tracking-wider">Last Asked</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.popular_questions.map((q, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-gray-400 font-mono text-xs w-8">{i + 1}</td>
                      <td className="py-2.5 px-3 text-gray-900 dark:text-white max-w-xs truncate">{q.question}</td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          {q.count} <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center"><ConfidenceBadge confidence={q.avg_confidence} /></td>
                      <td className="py-2.5 px-3 text-right text-gray-500 text-xs whitespace-nowrap">{timeAgo(q.last_asked)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}