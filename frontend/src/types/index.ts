export interface Stats {
  total_documents: number
  total_chunks: number
  total_queries: number
  avg_confidence: number
  escalation_rate: number
  popular_questions: { question: string; count: number }[]
  daily_query_count: { date: string; count: number }[]
  avg_response_time: number
}

export interface QueryRequest {
  question: string
  user_phone?: string
}

export interface QueryResponse {
  answer: string
  sources: { filename: string; page: number; text: string }[]
  confidence: number
  escalated: boolean
  chunks_used: number
  response_time_ms: number
  tokens_used?: number
  model?: string
}

export interface PlaygroundQueryResponse extends QueryResponse {
 chunks_retrieved: { text: string; filename: string; page: number; similarity: number }[]
 embedding_dimensions: number
  embedding_time_ms: number
  retrieval_time_ms: number
  generation_time_ms: number
}

export interface DocumentInfo {
  filename: string
  chunk_count: number
  uploaded_at: string
}

export interface DocumentList {
  documents: DocumentInfo[]
  total: number
}

export interface Conversation {
  id?: string
  timestamp: string
  user_phone: string
  question: string
  answer: string
  confidence: number
  sources: { filename: string; page: number; text: string }[]
  escalated: boolean
  response_time_ms: number
  sentiment?: 'positive' | 'neutral' | 'negative'
  category?: 'sales' | 'support' | 'info' | 'complaint'
  starred?: boolean
  tags?: string[]
  ai_summary?: string
}

export interface HealthStatus {
  status: string
  version: string
  services: { chromadb: boolean; groq: boolean; sheets: boolean; telegram: boolean }
  uptime_seconds: number
}

export interface AIInsight {
  id: string
  type: 'trend' | 'alert' | 'recommendation'
  icon: string
  title: string
  description: string
  priority?: 'low' | 'medium' | 'high'
  createdAt?: string
  action?: string
  actionLabel?: string
}

export interface CostSummary {
  tokens_today: number
  tokens_week: number
  tokens_month: number
  cost_today: number
  cost_week: number
  cost_month: number
  cost_per_query: number
  projected_monthly: number
  daily_cost_trend: { date: string; cost: number; tokens: number }[]
 top_users: { phone: string; cost: number; queries: number }[]
 feature_breakdown: { feature: string; cost: number; percentage: number }[]
 free_tier_usage: number
}

export interface Business {
  id: string
  name: string
  description: string
  document_count: number
  query_count: number
  created_at: string
  branding: {
    primary_color: string
    accent_color: string
    logo_url: string
  }
}

export interface Notification {
  id: string
  type: 'conversation' | 'escalation' | 'document' | 'system' | 'summary'
  title: string
  message: string
  read: boolean
  created_at: string
  data?: Record<string, unknown>
}

export interface WSMessage {
  type: 'new_conversation' | 'document_uploaded' | 'escalation' | 'stats_update' | 'notification'
  payload: unknown
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  responseTime?: number
  confidence?: number
  sources?: { filename: string; page: number; text: string }[]
 tokensUsed?: number
  chunksRetrieved?: { text: string; filename: string; page: number; similarity: number }[]
 technical?: {
    embeddingDimensions: number
    embeddingTimeMs: number
    retrievalTimeMs: number
    generationTimeMs: number
  }
}

export interface ThemeConfig {
  name: string
  primary: string
  accent: string
  background: string
  text: string
  fontSize: number
  borderRadius: number
  density: 'compact' | 'comfortable' | 'spacious'
  isDark: boolean
}
