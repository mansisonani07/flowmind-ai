/**
 * Intelligent question matching against uploaded document text
 * and fallback category-based demo responses.
 */
import { getAllDocTexts } from './storage'
import samplePlayground from '@/data/samplePlayground.json'

interface MatchResult {
  answer: string
  confidence: number
  source_document: string
  chunks_retrieved: number
  model: string
  response_time_ms: number
  tokens_used: number
}

// Category-based smart responses for when no document matches
const categoryResponses: Record<string, { answer: string; confidence: number }> = {
  greeting: { answer: `Hello! I am FlowMind AI, your document assistant. Ask me anything about your uploaded documents and I will find the most relevant information for you. You can ask about menus, services, pricing, policies, and more.`, confidence: 0.99 },
  menu: { answer: `Based on the available documents, here is what I found about the menu:

- **Appetizers**: Starting from $8.99
- **Main Courses**: $14.99 - $24.99
- **Desserts**: $7.99 - $12.99
- **Kids Menu**: Available for ages 10 and under
- **Daily Specials**: Ask your server for today featured items

**Vegetarian and Gluten-Free options** are clearly marked on the menu. We also accommodate common food allergies -- please inform your server.`, confidence: 0.88 },
  hours: { answer: `**Operating Hours:**

- Monday - Friday: 8:00 AM - 6:00 PM (Clinic) / 9:00 AM - 9:00 PM (Restaurant)
- Saturday: 9:00 AM - 1:00 PM (Clinic) / 10:00 AM - 10:00 PM (Restaurant)
- Sunday: Closed (Clinic) / 10:00 AM - 10:00 PM (Restaurant)

**Emergency appointments** are available 24/7 by calling the hotline.`, confidence: 0.92 },
  pricing: { answer: `**Pricing Information:**

| Plan | Price | Sessions | Features |
|------|-------|----------|----------|
| Basic | $99/mo | 4x 45min | Email support, monthly workshop |
| Premium | $299/mo | 8x 60min | Unlimited messaging, action plans, quarterly reviews |
| Enterprise | Custom | 90min sessions | Dedicated coach, priority support |

**Annual discount**: 10% off with prepayment.
**Cancellation**: Free 24h in advance. Within 24h: 50% fee.`, confidence: 0.90 },
  insurance: { answer: `**Accepted Insurance Plans:**

- Blue Cross Blue Shield
- Aetna
- Cigna
- United Healthcare
- Medicare
- Medicaid (qualifying patients)

For specific plan verification, contact our billing department or bring your insurance card to your first appointment.`, confidence: 0.93 },
  reservation: { answer: `**Reservation Information:**

- Reservations accepted for all party sizes
- Groups of 8+: Please call 24 hours in advance
- Private dining room available for 10-20 guests (48h notice)
- 15% gratuity automatically added for parties of 8+

**Contact**: (555) 456-7890 or book online through our website.`, confidence: 0.89 },
  telemedicine: { answer: `**Telemedicine Services:**

Available for:
- Follow-up visits
- Prescription renewals
- Initial consultations (non-emergency)

**Hours**: Monday-Friday, 9 AM - 5 PM
**Platform**: Secure video consultation
**Cost**: Same as in-person visits

Book through our website or call (555) 123-4567.`, confidence: 0.96 },
  coaching: { answer: `**Coaching Services:**

- **Basic Plan** ($99/mo): 4 sessions, email support, monthly workshop
- **Premium Plan** ($299/mo): 8 sessions, unlimited messaging, personalized action plans
- **Session Lengths**: Basic 45min, Premium 60min
- **First Session**: 15-20 min longer for goal-setting

You can switch plans anytime. Upgrades are prorated.`, confidence: 0.91 },
  lab: { answer: `**On-Site Lab Services:**

- Complete Blood Count (CBC)
- Comprehensive Metabolic Panel
- Lipid Panel
- HbA1c
- Thyroid Function Tests
- Urinalysis
- Rapid Strep and Flu Testing
- COVID-19 PCR Testing

Most results: 24-48 hours. Advanced tests: 3-5 business days.`, confidence: 0.96 },
  delivery: { answer: `**Delivery Information:**

- **Free delivery** within 5km radius
- **Standard delivery** (5-10km): $4.99
- **Express delivery** (within 1 hour): $7.99
- **Minimum order**: $15 for delivery

Orders can be placed via phone, website, or our mobile app.`, confidence: 0.87 },
  dietary: { answer: `**Dietary Accommodations:**

We take food allergies seriously:

- **Gluten-Free**: Dedicated menu section, separate kitchen area
- **Vegetarian**: 25+ dishes across all categories
- **Vegan**: Multiple options available
- **Nut-Free**: Please inform server of severity
- **Other Allergies**: Kitchen can accommodate most requests

**Important**: Always inform your server about any allergies before ordering.`, confidence: 0.88 },
}

const categoryKeywords: Record<string, string[]> = {
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'how are you', 'what can you', 'help me', 'what do you do'],
  menu: ['menu', 'food', 'dish', 'eat', 'restaurant', 'order', 'appetizer', 'dessert', 'drink', 'beverage', 'meal', 'lunch', 'dinner', 'breakfast', 'special', 'chef'],
  hours: ['hour', 'open', 'close', 'time', 'when', 'schedule', 'available', 'working'],
  pricing: ['price', 'cost', 'how much', 'fee', 'charge', 'rate', 'plan', 'package', 'subscription', 'monthly', 'pay'],
  insurance: ['insurance', 'coverage', 'plan accept', 'blue cross', 'aetna', 'cigna', 'medicare', 'medicaid', 'billing'],
  reservation: ['reservation', 'book', 'table', 'seat', 'party', 'group', 'guest', 'private dining'],
  telemedicine: ['telemedicine', 'video', 'virtual', 'online consultation', 'remote', 'telehealth'],
  coaching: ['coaching', 'coach', 'session', 'mentor', 'plan', 'basic', 'premium', 'enterprise'],
  lab: ['lab', 'test', 'blood', 'urine', 'x-ray', 'results', 'specimen', 'diagnostic'],
  delivery: ['delivery', 'deliver', 'pick up', 'takeout', 'take away', 'curbside', 'order online'],
  dietary: ['gluten', 'allerg', 'vegetarian', 'vegan', 'diet', 'nut-free', 'nut free', 'dairy-free', 'halal', 'kosher'],
}

function detectCategory(question: string): string | null {
  const q = question.toLowerCase()
  let bestCat: string | null = null
  let bestScore = 0
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    let score = 0
    for (const kw of keywords) {
      if (q.includes(kw)) score++
    }
    if (score > bestScore) { bestScore = score; bestCat = cat }
  }
  return bestScore >= 1 ? bestCat : null
}

function searchDocs(question: string): { text: string; filename: string; score: number } | null {
  const docs = getAllDocTexts()
  if (docs.length === 0) return null

  const qWords = question.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  if (qWords.length === 0) return null

  let best: { text: string; filename: string; score: number } | null = null
  for (const doc of docs) {
    const lower = doc.text.toLowerCase()
    let score = 0
    for (const w of qWords) {
      const idx = lower.indexOf(w)
      if (idx !== -1) {
        score += 1
        // Bonus for exact phrase match
        if (lower.includes(question.toLowerCase().slice(0, 20))) score += 2
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      // Extract relevant snippet
      const firstMatch = qWords.find(w => lower.includes(w))
      const matchIdx = lower.indexOf(firstMatch!)
      const start = Math.max(0, matchIdx - 100)
      const end = Math.min(doc.text.length, matchIdx + 300)
      const snippet = (start > 0 ? '...' : '') + doc.text.slice(start, end) + (end < doc.text.length ? '...' : '')
      best = { text: snippet, filename: doc.filename, score }
    }
  }
  return best
}

export async function getSmartResponse(question: string): Promise<MatchResult> {
  await new Promise(r => setTimeout(r, 400 + Math.random() * 500))

  // 1. Try preset demo responses (exact match)
  for (const [key, val] of Object.entries(samplePlayground.responses as Record<string, any>)) {
    if (question.toLowerCase().includes(key.toLowerCase().slice(0, 20)) ||
        key.toLowerCase().includes(question.toLowerCase().slice(0, 20))) {
      return { ...val, response_time_ms: 250 + Math.floor(Math.random() * 200) }
    }
  }

  // 2. Search uploaded documents
  const docMatch = searchDocs(question)
  if (docMatch) {
    return {
      answer: `**Found in ${docMatch.filename}:**\n\n${docMatch.text}\n\n---\n*Source: ${docMatch.filename} (relevance: ${Math.min(99, 70 + docMatch.score * 5)}%)*`,
      confidence: Math.min(0.97, 0.7 + docMatch.score * 0.05),
      source_document: docMatch.filename,
      chunks_retrieved: Math.max(1, docMatch.score),
      model: 'llama-3.3-70b-versatile',
      response_time_ms: 280 + Math.floor(Math.random() * 150),
      tokens_used: 120 + Math.floor(Math.random() * 80),
    }
  }

  // 3. Category-based response
  const cat = detectCategory(question)
  if (cat && categoryResponses[cat]) {
    const resp = categoryResponses[cat]
    return {
      answer: resp.answer,
      confidence: resp.confidence,
      source_document: 'knowledge base',
      chunks_retrieved: 2,
      model: 'llama-3.3-70b-versatile',
      response_time_ms: 300 + Math.floor(Math.random() * 200),
      tokens_used: 100 + Math.floor(Math.random() * 100),
    }
  }

  // 4. Fallback with contextual response
  const fb = samplePlayground.fallback_response as any
  return {
    answer: fb.answer,
    confidence: 0.78,
    source_document: fb.source_document,
    chunks_retrieved: fb.chunks_retrieved,
    model: fb.model,
    response_time_ms: fb.response_time_ms,
    tokens_used: fb.tokens_used,
  }
}
