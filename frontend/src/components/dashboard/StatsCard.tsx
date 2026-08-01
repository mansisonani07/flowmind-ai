import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const colorMap: Record<string, { bg: string; icon: string; border: string; text: string }> = {
  indigo: { bg: 'from-indigo-500/10 to-purple-500/10', icon: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', border: 'border-indigo-200/50 dark:border-indigo-800/30', text: 'text-indigo-600 dark:text-indigo-400' },
  purple: { bg: 'from-purple-500/10 to-pink-500/10', icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-800/30', text: 'text-purple-600 dark:text-purple-400' },
  emerald: { bg: 'from-emerald-500/10 to-teal-500/10', icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/30', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bg: 'from-amber-500/10 to-orange-500/10', icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-800/30', text: 'text-amber-600 dark:text-amber-400' },
}

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: { value: number; isPositive: boolean }
  color?: string
}

export default function StatsCard({ icon: Icon, label, value, trend, color = 'indigo' }: StatsCardProps) {
  const c = colorMap[color] || colorMap.indigo
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('rounded-xl border p-5 bg-gradient-to-br', c.bg, c.border)}
    >
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl', c.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
            {trend.isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
    </motion.div>
  )
}
