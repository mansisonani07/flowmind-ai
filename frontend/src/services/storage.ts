/**
 * Central localStorage persistence layer.
 * Merges user-generated data with sample demo data.
 */
import sampleDocuments from '@/data/sampleDocuments.json'
import sampleConversations from '@/data/sampleConversations.json'
import sampleNotifications from '@/data/sampleNotifications.json'

const P = 'flowmind_'

function get<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(P + key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function set<T>(key: string, val: T): void {
  try { localStorage.setItem(P + key, JSON.stringify(val)) } catch { /* full */ }
}

export interface UploadedDoc {
  id: string; filename: string; title: string; size_bytes: number; size_display: string;
  page_count: number; chunk_count: number; text_content: string;
  uploaded_at: string; description: string; tags: string[]; is_sample: boolean;
}
export interface UserConversation {
  id: string; question: string; answer: string; answer_preview: string;
  confidence: number; timestamp: string; source_document: string;
  escalated: boolean; category: string; sentiment: string; starred: boolean;
  tags: string[]; is_user: boolean;
}
export interface UserNotification {
  id: string; type: 'conversation' | 'document' | 'system' | 'escalation';
  title: string; message: string; timestamp: string; read: boolean;
  priority: 'info' | 'warning' | 'high';
}
export interface DailyQuery { date: string; count: number }
export interface UsageStats {
  totalQueries: number; avgConfidence: number; escalationRate: number;
  queriesToday: number; dailyQueries: DailyQuery[];
}

export function getUploads(): UploadedDoc[] { return get<UploadedDoc[]>('uploads', []) }

export function addUpload(doc: UploadedDoc): void {
  const u = getUploads(); u.unshift(doc); set('uploads', u)
  addNotification({ id: `n-${Date.now()}`, type: 'document', title: 'Document Uploaded',
    message: `${doc.filename} (${doc.size_display}) processed into ${doc.chunk_count} chunks.`,
    timestamp: new Date().toISOString(), read: false, priority: 'info' })
}

export function deleteUpload(id: string): void {
  set('uploads', getUploads().filter(d => d.id !== id))
}

export function getUserConversations(): UserConversation[] { return get<UserConversation[]>('conversations', []) }

export function addUserConversation(c: UserConversation): void {
  const list = getUserConversations(); list.unshift(c); set('conversations', list)
  bumpQuery(c.timestamp, c.confidence, c.escalated)
  addNotification({ id: `n-${Date.now()}`, type: 'conversation', title: 'New Conversation',
    message: `Query: "${c.question.slice(0, 60)}..." — ${(c.confidence * 100).toFixed(0)}% confidence.`,
    timestamp: new Date().toISOString(), read: false, priority: 'info' })
  if (c.escalated) {
    addNotification({ id: `n-${Date.now()}-e`, type: 'escalation', title: 'Query Escalated',
      message: `Low confidence for: "${c.question.slice(0, 50)}..."`,
      timestamp: new Date().toISOString(), read: false, priority: 'high' })
  }
}

export function getUserNotifications(): UserNotification[] { return get<UserNotification[]>('notifications', []) }

export function addNotification(n: UserNotification): void {
  const list = getUserNotifications(); list.unshift(n)
  if (list.length > 50) list.length = 50
  set('notifications', list)
}

export function markNotifRead(id: string): void {
  const list = getUserNotifications(); const n = list.find(x => x.id === id)
  if (n) { n.read = true; set('notifications', list) }
}

export function markAllNotifRead(): void {
  const list = getUserNotifications(); list.forEach(n => n.read = true); set('notifications', list)
}

function getStats(): UsageStats {
  return get<UsageStats>('stats', {
    totalQueries: 247, avgConfidence: 87.3, escalationRate: 4.2, queriesToday: 28,
    dailyQueries: Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i)
      return { date: d.toISOString().slice(0, 10), count: 5 + Math.floor(Math.random() * 18) }
    }),
  })
}

function bumpQuery(_ts: string, conf: number, esc: boolean): void {
  const s = getStats(); s.totalQueries++
  s.avgConfidence = (s.avgConfidence * (s.totalQueries - 1) + conf * 100) / s.totalQueries
  if (esc) s.escalationRate = Math.min(100, s.escalationRate + 0.3)
  const today = new Date().toISOString().slice(0, 10)
  const entry = s.dailyQueries.find(d => d.date === today)
  if (entry) { entry.count++ } else { s.dailyQueries.push({ date: today, count: 1 }); if (s.dailyQueries.length > 30) s.dailyQueries.shift() }
  s.queriesToday = entry?.count ?? 1
  set('stats', s)
}

export function getAllDocuments(): UploadedDoc[] {
  const samples: UploadedDoc[] = (sampleDocuments as any[]).map(d => ({ ...d, text_content: '', is_sample: true }))
  return [...getUploads(), ...samples]
}

export function getAllConversations(): UserConversation[] {
  const samples: UserConversation[] = (sampleConversations as any[]).map(c => ({ ...c, is_user: false }))
  return [...getUserConversations(), ...samples]
}

export function getAllNotifications(): UserNotification[] {
  const samples: UserNotification[] = (sampleNotifications as any[]).map((n: any) => ({
    id: n.id, type: n.type, title: n.title, message: n.description,
    timestamp: n.timestamp, read: n.read,
    priority: (n.priority === 'high' ? 'high' : n.priority === 'warning' ? 'warning' : 'info') as UserNotification['priority'],
  }))
  return [...getUserNotifications(), ...samples]
}

export function getLiveStats() {
  const s = getStats()
  return { ...s, totalDocuments: getAllDocuments().length }
}

export function startPeriodicNotifications(): () => void {
  const msgs = [
    { type: 'system' as const, title: 'System Health Check', message: 'All services operational. Uptime: 99.7%. Avg response: 342ms.' },
    { type: 'conversation' as const, title: 'Query Volume Update', message: 'Query volume trending 12% above average today.' },
    { type: 'system' as const, title: 'Index Optimization', message: 'Vector embeddings re-optimized. Query latency improved by 8%.' },
    { type: 'system' as const, title: 'Storage Usage', message: `Using ${getAllDocuments().length} of 10 document slots on free tier.` },
  ]
  let idx = 0
  const t = setInterval(() => {
    const m = msgs[idx % msgs.length]
    addNotification({ id: `n-${Date.now()}`, ...m, timestamp: new Date().toISOString(), read: false, priority: 'info' })
    idx++
  }, 5 * 60 * 1000)
  return () => clearInterval(t)
}

export function getAllDocTexts(): { filename: string; text: string }[] {
  return getUploads().map(d => ({ filename: d.filename, text: d.text_content })).filter(d => d.text.length > 0)
}

/* ──────────────── Cost Tracking ──────────────── */

export interface CostSnapshot {
  tokens_today: number; cost_today: number; cost_this_week: number;
  cost_per_query: number; projected_monthly: number; queries_today: number;
  daily_tokens: { date: string; tokens: number }[];
  free_tier: { groq_api: number; storage: number; bandwidth: number; documents: number };
}

function getCosts(): CostSnapshot {
  return get<CostSnapshot>('costs', {
    tokens_today: 42500, cost_today: 0, cost_this_week: 0,
    cost_per_query: 0.0001, projected_monthly: 0,
    queries_today: 0,
    daily_tokens: Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 6 + i)
      return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), tokens: 25000 + Math.floor(Math.random() * 25000) }
    }),
    free_tier: { groq_api: 45, storage: 12, bandwidth: 8, documents: 30 },
  })
}

export function bumpCosts(tokens: number): void {
  const c = getCosts()
  c.tokens_today += tokens
  c.queries_today++
  c.cost_today = c.tokens_today * 0.0000001
  c.cost_this_week = c.cost_today * 5
  c.cost_per_query = c.tokens_today / c.queries_today * 0.0000001
  c.projected_monthly = c.cost_today * 30
  // Update today's entry in daily_tokens
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  const entry = c.daily_tokens.find(d => d.date === today)
  if (entry) { entry.tokens += tokens } else { c.daily_tokens.push({ date: today, tokens }); if (c.daily_tokens.length > 7) c.daily_tokens.shift() }
  // Bump free tier usage
  c.free_tier.groq_api = Math.min(100, c.free_tier.groq_api + tokens / 500000 * 100)
  set('costs', c)
}

export function bumpCostsOnUpload(): void {
  const c = getCosts()
  c.free_tier.documents = Math.min(100, c.free_tier.documents + 10)
  c.free_tier.storage = Math.min(100, c.free_tier.storage + 3)
  set('costs', c)
}

export function getCostSnapshot(): CostSnapshot { return getCosts() }

/* ──────────────── UI Preferences ──────────────── */

export interface UIPrefs {
  sidebarCollapsed: boolean; lastPage: string;
  docSearch: string; convSearch: string; convConfFilter: string; convDateFilter: string;
  notifSearch: string; notifTypeFilter: string;
}

const defaultPrefs: UIPrefs = {
  sidebarCollapsed: false, lastPage: '/',
  docSearch: '', convSearch: '', convConfFilter: 'all', convDateFilter: 'all',
  notifSearch: '', notifTypeFilter: 'all',
}

export function getPrefs(): UIPrefs { return get<UIPrefs>('prefs', defaultPrefs) }
export function setPref<K extends keyof UIPrefs>(key: K, val: UIPrefs[K]): void {
  const p = getPrefs(); p[key] = val; set('prefs', p)
}
