import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Coins, DollarSign, Calculator, TrendingUp, AlertTriangle, Lightbulb,
  Zap, FileText, Database, Wifi,
} from 'lucide-react'
import { sampleCosts } from '@/lib/api'
import { getCostSnapshot, type CostSnapshot } from '@/services/storage'
import CostChart from '@/components/costs/CostChart'
import Card from '@/components/ui/Card'
import { cn, formatNumber } from '@/lib/utils'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

function AnimatedCounter({ value, prefix = '', decimals = 0 }: { value: number; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = value
    const step = target / 30
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) { current = target; clearInterval(timer) }
      setDisplay(current)
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <span>{prefix}{display.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
}

const tierIconMap: Record<string, typeof Zap> = {
  groq_api: Zap, storage: Database, bandwidth: Wifi, documents: FileText,
}

export default function Costs() {
  const [loading, setLoading] = useState(true)
  const [liveCosts, setLiveCosts] = useState<CostSnapshot | null>(null)

  const refresh = useCallback(() => { setLiveCosts(getCostSnapshot()) }, [])

  useEffect(() => {
    refresh()
    const timer = setTimeout(() => setLoading(false), 500)
    // Refresh every 3s for real-time feel
    const interval = setInterval(refresh, 3000)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [refresh])

  if (loading || !liveCosts) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl border p-5 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const s = liveCosts
  const stats = [
    { icon: Coins, label: 'Tokens Today', value: formatNumber(s.tokens_today), rawValue: s.tokens_today, color: 'from-indigo-500/10 to-purple-500/10', iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', border: 'border-indigo-200/50 dark:border-indigo-800/30' },
    { icon: DollarSign, label: 'Cost This Week', value: `$${s.cost_this_week.toFixed(2)}`, rawValue: s.cost_this_week, prefix: '$', decimals: 2, color: 'from-emerald-500/10 to-teal-500/10', iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/30' },
    { icon: Calculator, label: 'Cost Per Query', value: `$${s.cost_per_query.toFixed(4)}`, rawValue: s.cost_per_query, prefix: '$', decimals: 4, color: 'from-amber-500/10 to-orange-500/10', iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-800/30' },
    { icon: TrendingUp, label: 'Projected Monthly', value: `$${s.projected_monthly.toFixed(2)}`, rawValue: s.projected_monthly, prefix: '$', decimals: 2, color: 'from-cyan-500/10 to-blue-500/10', iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400', border: 'border-cyan-200/50 dark:border-cyan-800/30' },
  ]

  const freeTierData = [
    { key: 'groq_api', label: 'Groq API Calls', percent: s.free_tier.groq_api, used: Math.round(s.free_tier.groq_api * 5000 / 100), limit: 500000 },
    { key: 'storage', label: 'Vector Storage (GB)', percent: s.free_tier.storage, used: +(s.free_tier.storage * 6 / 100).toFixed(1), limit: 6.0 },
    { key: 'bandwidth', label: 'Bandwidth (GB)', percent: s.free_tier.bandwidth, used: +(s.free_tier.bandwidth * 10 / 100).toFixed(1), limit: 10.0 },
    { key: 'documents', label: 'Documents', percent: s.free_tier.documents, used: Math.round(s.free_tier.documents * 10 / 100), limit: 10 },
  ]

  const maxTierUsage = Math.max(...freeTierData.map(d => d.percent))

  // Build chart data from live costs + sample data fallback
  const dailyChartData = s.daily_tokens.length >= 7
    ? s.daily_tokens
    : sampleCosts.daily_costs.map(d => ({ date: d.date, tokens: d.tokens }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cost Tracking</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor usage, spending, and optimize costs</p>
      </motion.div>

      {/* Free tier usage alert */}
      {maxTierUsage > 75 && (
        <motion.div variants={item} className="rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-900/10 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Free tier usage is high</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Groq API calls at {freeTierData[0].percent.toFixed(0)}% of free limit. Consider upgrading for unlimited access.</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn('rounded-xl border p-5 bg-gradient-to-br', stat.color, stat.border)}>
            <div className={cn('p-2.5 rounded-xl w-fit', stat.iconBg)}><stat.icon className="w-5 h-5" /></div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                <AnimatedCounter value={stat.rawValue} prefix={stat.prefix || ''} decimals={stat.decimals || 0} />
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Free tier usage bars */}
      <motion.div variants={item} className="glass rounded-xl p-4 sm:p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Free Tier Usage</h3>
        <div className="space-y-4">
          {freeTierData.map(({ key, label, percent }) => {
            const Icon = tierIconMap[key] || Zap
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{percent.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percent, 100)}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', percent > 75 ? 'bg-amber-500' : percent > 50 ? 'bg-indigo-500' : 'bg-emerald-500')} />
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Charts row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <CostChart
          title="Daily Token Usage"
          subtitle="Tokens consumed over 7 days"
          data={dailyChartData}
          type="line" dataKey="tokens" nameKey="date"
          colors={['#6366f1', '#8b5cf6']}
          yAxisDomain={[0, 50000]}
          yAxisTickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          tooltipFormatter={(v: number) => v.toLocaleString() + ' tokens'}
        />
        <div className="glass rounded-xl p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Token Usage by Feature</h3>
          <p className="text-xs text-gray-500 mt-0.5 mb-4">Where tokens are being spent</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={sampleCosts.feature_breakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="tokens" stroke="none" nameKey="name">
                {sampleCosts.feature_breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatNumber(v)} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {sampleCosts.feature_breakdown.map((f, i) => (
              <span key={f.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                {f.name} ({f.percent}%)
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Optimization tips */}
      <motion.div variants={item}>
        <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
          header={<div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <div><h3 className="font-semibold text-gray-900 dark:text-white">Optimization Tips</h3><p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Reduce your AI costs</p></div>
          </div>}>
          <div className="space-y-4">
            {sampleCosts.optimization_tips.map((tip, i) => {
              const tipIcons: Record<string, typeof Zap> = { high: Zap, medium: FileText, low: TrendingUp }
              const TipIcon = tipIcons[tip.impact] || Lightbulb
              return (
                <motion.div key={tip.title} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-colors">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                    <TipIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tip.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tip.description}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">{tip.savings}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
