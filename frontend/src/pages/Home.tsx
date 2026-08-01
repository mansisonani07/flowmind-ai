import { motion } from 'framer-motion'
import { FileText, MessageSquare, Target, AlertTriangle, Upload, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import StatsCard from '@/components/dashboard/StatsCard'
import ChartCard from '@/components/dashboard/ChartCard'
import RecentActivity from '@/components/dashboard/RecentActivity'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import { useStats } from '@/hooks/useStats'
import { formatNumber, formatPercent } from '@/lib/utils'
import { sampleStats } from '@/lib/api'
import type { Conversation } from '@/types'

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

const recentConversations: Conversation[] = sampleStats.recent_conversations.map(c => ({
  id: c.id, timestamp: c.timestamp, user_phone: '+1-555-1234',
  question: c.question, answer: c.answer_preview,
  confidence: c.confidence, sources: [{ filename: c.source_document, page: 1, text: c.answer_preview }],
  escalated: c.escalated, response_time_ms: 300 + Math.floor(Math.random() * 200),
}))

export default function Home() {
  const { stats, isLoading } = useStats()

  if (isLoading) return <Loading text="Loading dashboard..." className="h-96" />

  const chartData = stats.daily_query_count.length > 0
    ? stats.daily_query_count
    : sampleStats.chart_data.map(d => ({ date: d.date, count: d.queries }))

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 sm:space-y-6">
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard icon={FileText} label="Documents" value={formatNumber(stats.total_documents || 0)} color="indigo" trend={{ value: 50, isPositive: true }} />
        <StatsCard icon={MessageSquare} label="Total Queries" value={formatNumber(stats.total_queries || 0)} color="purple" trend={{ value: 23, isPositive: true }} />
        <StatsCard icon={Target} label="Avg Confidence" value={formatPercent(stats.avg_confidence || 0)} color="emerald" trend={{ value: 3.2, isPositive: true }} />
        <StatsCard icon={AlertTriangle} label="Escalations" value={formatPercent(stats.escalation_rate || 0)} color="amber" trend={{ value: 1.5, isPositive: false }} />
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Query Volume" subtitle="Last 7 days">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" interval={Math.floor(chartData.length / 5)} />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" width={35} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3, fill: '#6366f1' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <div>
          <ChartCard title="Recent Activity" subtitle="Latest conversations">
            <RecentActivity conversations={recentConversations} />
          </ChartCard>
        </div>
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Link to="/documents">
          <Button iconLeft={<Upload className="w-4 h-4" />} variant="secondary">Upload Document</Button>
        </Link>
        <Link to="/analytics">
          <Button iconLeft={<BarChart3 className="w-4 h-4" />} variant="secondary">View Analytics</Button>
        </Link>
      </motion.div>
    </motion.div>
  )
}
