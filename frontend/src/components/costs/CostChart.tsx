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
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import Card from '@/components/ui/Card'

interface CostChartProps {
  title: string
  subtitle?: string
  data: Record<string, unknown>[]
  type: 'line' | 'bar' | 'pie'
  dataKey?: string
  nameKey?: string
  colors?: string[]
  yAxisDomain?: [number, number]
  yAxisTickFormatter?: (v: number) => string
  tooltipFormatter?: (v: number, name: string) => string
  className?: string
}

const defaultColors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function CustomTooltip({ active, payload, label, formatter }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string; formatter?: (v: number, name: string) => string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 rounded-xl px-4 py-3 shadow-lg">
      {label && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
          <span className="font-semibold text-gray-900 dark:text-white ml-auto">{formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function ChartContent({ data, type, dataKey, nameKey, colors, yAxisDomain, yAxisTickFormatter, tooltipFormatter }: { data: Record<string, unknown>[]; type: string; dataKey: string; nameKey: string; colors: string[]; yAxisDomain?: [number, number]; yAxisTickFormatter?: (v: number) => string; tooltipFormatter?: (v: number, name: string) => string }) {
  if (type === 'line') {
    return (
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`costGrad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors[0]} stopOpacity={0.35} />
            <stop offset="50%" stopColor={colors[0]} stopOpacity={0.15} />
            <stop offset="95%" stopColor={colors[0]} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} stroke="#9ca3af" tickFormatter={(v: string) => typeof v === 'string' && v.length > 8 ? v.slice(0, 8) : v} />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" domain={yAxisDomain} tickFormatter={yAxisTickFormatter} />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        <Area type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2.5} fill={`url(#costGrad-${dataKey})`} dot={{ r: 4, fill: colors[0], strokeWidth: 0 }} activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2, fill: '#fff' }} />
      </AreaChart>
    )
  }
  if (type === 'bar') {
    return (
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={dataKey} radius={[8, 8, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    )
  }
  return (
    <PieChart>
      <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey={dataKey} nameKey={nameKey} stroke="none">
        {data.map((_, index) => (
          <Cell key={index} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
    </PieChart>
  )
}

export default function CostChart({ title, subtitle, data, type, dataKey = 'value', nameKey = 'name', colors = defaultColors, yAxisDomain, yAxisTickFormatter, tooltipFormatter, className }: CostChartProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={className}>
      <Card
        className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50"
        header={
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        }
      >
        {data.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ChartContent data={data} type={type} dataKey={dataKey} nameKey={nameKey} colors={colors} yAxisDomain={yAxisDomain} yAxisTickFormatter={yAxisTickFormatter} tooltipFormatter={tooltipFormatter} />
          </ResponsiveContainer>
        )}
      </Card>
    </motion.div>
  )
}
