import { useQuery } from '@tanstack/react-query'
import { queryAPI } from '@/lib/api'
import type { Stats } from '@/types'

const emptyStats: Stats = {
  total_documents: 0,
  total_chunks: 0,
  total_queries: 0,
  avg_confidence: 0,
  escalation_rate: 0,
  popular_questions: [],
  daily_query_count: [],
  avg_response_time: 0,
}

export function useStats(days = 7) {
  const { data = emptyStats, isLoading, error, refetch } = useQuery({
    queryKey: ['stats', days],
    queryFn: () => queryAPI.getStats(days).then((r) => r.data),
    refetchInterval: 30000,
  })

  return { stats: data, isLoading, error, refetch }
}
