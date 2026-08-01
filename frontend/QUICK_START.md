# FlowMind AI Dashboard - Quick Start

## 3 Steps to Run (No Backend Needed!)

### Step 1: Install Dependencies
```bash
cd frontend
npm install --legacy-peer-deps
```

### Step 2: Start the Dev Server
```bash
npm run dev
```

### Step 3: Open in Browser
Navigate to: **http://localhost:3000**

That's it! The dashboard runs in **Demo Mode** with sample data.
No Python, no backend, no database required.

---

## What You'll See

| Page | What's Displayed |
|------|-----------------|
| **Dashboard** | 4 stat cards + query volume chart + 5 recent conversations |
| **Playground** | AI chat with 4 clickable sample questions + tech details panel |
| **Documents** | 3 sample documents with chunks, sizes, tags, and descriptions |
| **Conversations** | 15 conversations with filters (date, confidence, escalated) |
| **Analytics** | 4 charts (area, bar, pie, line) + top questions table |
| **Costs** | Token stats, free tier usage bars, feature breakdown pie chart |
| **Notifications** | 15 notifications with filter tabs (All, Conversations, Escalations, Documents, System) |
| **Themes** | 5 preset themes + full customizer (works client-only) |
| **Settings** | API config, RAG settings, notification toggles (works client-only) |

## Demo Mode

The app runs in **Demo Mode** by default (`VITE_DEMO_MODE=true` in `.env`).
All data comes from local JSON files in `src/data/`. Zero backend API calls.

## To Connect a Real Backend

1. Set `VITE_DEMO_MODE=false` in the `.env` file
2. Start your FastAPI backend on `localhost:8000`
3. The frontend will automatically switch to live API calls

## Tech Stack

- **React 19** + TypeScript 5.6
- **Vite 6** (blazing fast HMR)
- **Tailwind CSS 4** (glassmorphism design)
- **Framer Motion 11** (page transitions + animations)
- **Recharts 2** (4 chart types)
- **TanStack React Query 5** (data fetching)
- **Lucide React** (icon library)

## Project Structure

```
frontend/
  src/
    data/           ← Demo JSON data files (7 files)
    lib/api.ts      ← Demo mode API interceptor
    pages/          ← 9 page components
    components/     ← Reusable UI components
    hooks/          ← Custom React hooks
    context/        ← React contexts
    types/          ← TypeScript interfaces
```
