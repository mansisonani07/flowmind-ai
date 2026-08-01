# FlowMind AI - Quick Start Guide

## What is this?
FlowMind AI is a **RAG (Retrieval-Augmented Generation) Document Q&A Dashboard** built with React 19, TypeScript, Tailwind CSS v4, Framer Motion, and Recharts. It features a beautiful glassmorphism UI with dark mode, 10 fully functional pages, and works **100% standalone in demo mode** — no backend required.

## Prerequisites
- **Node.js** 18+ (recommended: 20+)
- **npm** 9+ (comes with Node.js)

## 3 Steps to Run

### Step 1: Open Terminal
```
cd flowmind-ai/frontend
```

### Step 2: Install Dependencies
```
npm install --legacy-peer-deps
```
> Note: `--legacy-peer-deps` is needed because `react-confetti` hasn't updated its peer dependency for React 19 yet. This is safe and won't affect functionality.

### Step 3: Start the Dev Server
```
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

## What You'll See

| Page | Description |
|------|-------------|
| **Home** | Stats cards (3 docs, 247 queries, 87.3% confidence), 7-day trend chart, recent activity |
| **Documents** | 3 sample PDFs with chunk counts, file sizes, tags, and upload zone |
| **Conversations** | 15 sample Q&A conversations with filters (date, confidence, escalation) |
| **Analytics** | 5 interactive Recharts charts: query volume, confidence distribution, categories pie, response times, top questions table |
| **Playground** | Interactive AI chat with 4 preset sample questions, tech details panel (342ms response, llama-3.3-70b-versatile model, 156 tokens) |
| **Costs** | Token usage, free tier bars (Groq 45%, Storage 12%, Bandwidth 8%), optimization tips |
| **Notifications** | 15 notifications with filter tabs (All, Conversations, Escalations, Documents, System) |
| **Settings** | App configuration page |
| **Theme** | Theme customizer with color pickers |
| **Business Settings** | Business profile editor with branding colors and stats |

## Features
- ✅ Zero backend needed (Demo Mode)
- ✅ Dark/Light theme toggle
- ✅ Glassmorphism design with backdrop blur
- ✅ Framer Motion page transitions
- ✅ Skeleton loading states
- ✅ Responsive design (mobile + desktop)
- ✅ Keyboard shortcuts (Ctrl+K for command palette)
- ✅ Onboarding wizard with confetti
- ✅ Playground chat with localStorage persistence
- ✅ Export chat as JSON or PDF
- ✅ Command palette (Cmd/Ctrl+K)

## Production Build
```
npm run build
```
Output goes to `frontend/dist/` — deploy to Vercel, Netlify, or any static host.

## Tech Stack
| Technology | Version |
|-----------|---------|
| React | 19.0 |
| TypeScript | 5.6 |
| Vite | 6.0 |
| Tailwind CSS | 4.0 |
| Framer Motion | 11.11 |
| Recharts | 2.13 |
| Lucide Icons | 0.454 |
| TanStack Query | 5.59 |

## Project Structure
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── analytics/   # DateRangePicker, HeatmapChart
│   │   ├── costs/       # CostChart
│   │   ├── dashboard/   # StatsCard, ChartCard, RecentActivity
│   │   ├── documents/   # DocumentCard, UploadZone
│   │   ├── layout/      # Sidebar, Header, Layout
│   │   ├── notifications/ # NotificationDropdown, NotificationItem
│   │   ├── onboarding/  # OnboardingWizard
│   │   ├── playground/  # ChatInterface, ChatBubble, TechDetails
│   │   └── ui/          # Button, Card, Input, Skeleton, etc.
│   ├── context/         # Theme, Auth, Toast, Notification contexts
│   ├── data/            # 7 JSON demo data files
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # 10 page components
│   ├── lib/             # API layer (demo mode), utils
│   └── types/           # TypeScript interfaces
├── .env                 # VITE_DEMO_MODE=true (default)
└── package.json
```

## Demo Data
All data comes from 7 JSON files in `src/data/`:
- `sampleStats.json` — Dashboard statistics
- `sampleConversations.json` — 15 Q&A conversations
- `sampleDocuments.json` — 3 PDF documents
- `sampleNotifications.json` — 15 notifications
- `sampleAnalytics.json` — 30-day analytics data
- `sampleCosts.json` — Cost tracking data
- `samplePlayground.json` — AI responses and tech details

## Troubleshooting

**Q: Port 3000 is in use?**
Edit `vite.config.ts` and change `server.port` to another number.

**Q: npm install fails with peer dependency errors?**
Use `npm install --legacy-peer-deps`.

**Q: Pages show blank?**
Make sure `VITE_DEMO_MODE=true` is set in the `.env` file (it's the default).

**Q: Want to use a real backend?**
Set `VITE_DEMO_MODE=false` and `VITE_API_URL=http://your-backend:8000` in `.env`.
