import type { QueryRequest, QueryResponse, Stats, DocumentList, Conversation } from '@/types'
import { getSmartResponse } from '@/services/questionMatcher'
import {
  getAllDocuments, getAllConversations, getAllNotifications,
  getLiveStats, addUpload, deleteUpload,
  addUserConversation, markAllNotifRead,
  bumpCosts, bumpCostsOnUpload,
} from '@/services/storage'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'

import sampleStats from '@/data/sampleStats.json'
import sampleConversations from '@/data/sampleConversations.json'
import sampleDocuments from '@/data/sampleDocuments.json'
import sampleNotifications from '@/data/sampleNotifications.json'
import sampleAnalytics from '@/data/sampleAnalytics.json'
import sampleCosts from '@/data/sampleCosts.json'
import samplePlayground from '@/data/samplePlayground.json'

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export { sampleStats, sampleConversations, sampleDocuments, sampleNotifications, sampleAnalytics, sampleCosts, samplePlayground }
export { DEMO_MODE, getAllDocuments, getAllConversations, getAllNotifications, getLiveStats, addUpload, deleteUpload, addUserConversation, markAllNotifRead, bumpCosts, bumpCostsOnUpload }
export type { UploadedDoc } from '@/services/storage'

const demoHandlers = {
  getStats: async (_days?: number) => {
    await delay(200)
    const live = getLiveStats()
    return {
      data: {
        total_documents: live.totalDocuments,
        total_chunks: 140 + getAllDocuments().filter(d => !d.is_sample).reduce((a, d) => a + d.chunk_count, 0),
        total_queries: live.totalQueries,
        avg_confidence: live.avgConfidence / 100,
        escalation_rate: live.escalationRate / 100,
        popular_questions: sampleAnalytics.top_questions.map(q => ({ question: q.question, count: q.count })),
        daily_query_count: live.dailyQueries.map(d => ({ date: d.date, count: d.count })),
        avg_response_time: sampleStats.response_time_avg,
      } as Stats,
    }
  },

  ask: async (data: QueryRequest) => {
    const resp = await getSmartResponse(data.question)
    bumpCosts(resp.tokens_used)
    // Save conversation to localStorage
    addUserConversation({
      id: `uc-${Date.now()}`, question: data.question,
      answer: resp.answer, answer_preview: resp.answer.slice(0, 120),
      confidence: resp.confidence, timestamp: new Date().toISOString(),
      source_document: resp.source_document, escalated: resp.confidence < 0.7,
      category: 'general', sentiment: 'neutral', starred: false, tags: [], is_user: true,
    })
    return {
      data: {
        answer: resp.answer,
        sources: [{ filename: resp.source_document, page: 1, text: resp.answer.slice(0, 100) }],
        confidence: resp.confidence, escalated: resp.confidence < 0.7,
        chunks_used: resp.chunks_retrieved, response_time_ms: resp.response_time_ms,
        tokens_used: resp.tokens_used, model: resp.model,
        chunks_retrieved: Array.from({ length: resp.chunks_retrieved }, (_, i) => ({
          text: `Retrieved chunk ${i + 1} from ${resp.source_document}...`,
          filename: resp.source_document, page: i + 1, similarity: 0.92 - i * 0.05,
        })),
        embedding_dimensions: samplePlayground.tech_details.embedding_dimensions,
        embedding_time_ms: Math.round(resp.response_time_ms * 0.25),
        retrieval_time_ms: Math.round(resp.response_time_ms * 0.35),
        generation_time_ms: Math.round(resp.response_time_ms * 0.4),
      } as QueryResponse,
    }
  },

  listDocuments: async () => {
    await delay(150)
    const allDocs = getAllDocuments()
    return {
      data: {
        documents: allDocs.map(d => ({ filename: d.filename, chunk_count: d.chunk_count, uploaded_at: d.uploaded_at })),
        total: allDocs.length,
      } as DocumentList,
    }
  },

  listConversations: async (limit = 50) => {
    await delay(150)
    return {
      data: getAllConversations().slice(0, limit).map(c => ({
        id: c.id, timestamp: c.timestamp,
        user_phone: c.is_user ? 'You (Demo)' : '+1-555-' + String(Math.floor(Math.random() * 9000 + 1000)),
        question: c.question, answer: c.answer, confidence: c.confidence,
        sources: [{ filename: c.source_document, page: 1, text: c.answer_preview }],
        escalated: c.escalated, response_time_ms: 300 + Math.floor(Math.random() * 200),
        sentiment: c.sentiment, category: c.category, starred: c.starred, tags: c.tags,
      })) as Conversation[],
    }
  },

  listNotifications: async () => {
    await delay(150)
    return {
      data: getAllNotifications().map(n => ({
        id: n.id, type: n.type, title: n.title, message: n.message,
        read: n.read, created_at: n.timestamp,
      })),
    }
  },

  getCosts: async () => { await delay(150); return { data: sampleCosts } },

  getAnalytics: async () => {
    await delay(250)
    const live = getLiveStats()
    return { data: { ...sampleAnalytics, daily_queries: live.dailyQueries.map(d => ({ date: d.date, queries: d.count })), summary: { ...sampleAnalytics.summary, total_queries: live.totalQueries, avg_confidence: live.avgConfidence } } }
  },

  markAllRead: async () => { markAllNotifRead(); return { data: { success: true } } },

  getHealth: async () => ({ data: { status: 'healthy', version: '2.1.0', services: { chromadb: true, groq: true, sheets: true, telegram: true }, uptime_seconds: 864000 } }),
}

export const queryAPI = { ask: (data: QueryRequest) => demoHandlers.ask(data), getStats: (days = 7) => demoHandlers.getStats(days), getHealth: () => demoHandlers.getHealth() }

export const documentsAPI = {
  list: () => demoHandlers.listDocuments(),
  delete: async (filename: string) => { deleteUpload(filename); return { data: { success: true } } },
  get: async (_filename: string) => ({ data: { content: 'Demo document content' } }),
  upload: async (_file: File) => { await delay(800); return { data: { success: true, filename: 'demo.pdf' } } },
}

export const conversationsAPI = { list: (limit = 50) => demoHandlers.listConversations(limit) }

export const demoAPI = {
  getAnalytics: () => demoHandlers.getAnalytics(),
  getCosts: () => demoHandlers.getCosts(),
  getNotifications: () => demoHandlers.listNotifications(),
  markAllNotificationsRead: () => demoHandlers.markAllRead(),
}

export default {} as any
