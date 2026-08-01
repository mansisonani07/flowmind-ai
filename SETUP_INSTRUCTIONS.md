# FlowMind AI v3.0 - Setup

## Quick Start
1. Double-click `INSTALL.bat` (or `python install.py`)
2. Double-click `START.bat` (or `python start.py`)
3. Open http://localhost:5173

## Manual
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## Requirements
- Node.js 18+ (LTS)
- Modern browser

## v3.0 Features
- Full mobile responsiveness (375px - 1920px+)
- Dynamic notifications triggered by user actions
- Real-time cost tracking that updates with usage
- Search on Documents, Conversations, Notifications
- Delete confirmation modals for safety
- Improved PDF text extraction
- All preferences saved to localStorage
- Purple gradient area chart on Costs page

## Troubleshooting
```bash
npm install --legacy-peer-deps --force
npx kill-port 5173
```
