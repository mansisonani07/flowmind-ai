import { MessageSquare, Clock, AlertCircle } from 'lucide-react'
import { cn, timeAgo, getConfidenceColor } from '@/lib/utils'
import type { Conversation } from '@/types'

interface RecentActivityProps {
  conversations: Conversation[]
}

export default function RecentActivity({ conversations }: RecentActivityProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No conversations yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {conversations.slice(0, 5).map((c, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', getConfidenceColor(c.confidence).replace('text-', 'bg-'))} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-white truncate">{c.question}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-400"><Clock className="w-3 h-3" />{timeAgo(c.timestamp)}</span>
              {c.escalated && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="w-3 h-3" />Escalated</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
