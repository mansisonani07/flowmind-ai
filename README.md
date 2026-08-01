# FlowMind AI

> WhatsApp Business Assistant with n8n + RAG — Answer customer questions instantly using your business documents.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)

**FlowMind AI** is a production-ready WhatsApp AI assistant for small businesses. Upload your business documents — menus, FAQs, price lists, service descriptions — and FlowMind instantly answers customer questions on WhatsApp with accurate, source-cited responses powered by retrieval-augmented generation (RAG). When the AI isn't confident, it automatically escalates to a human via Telegram alerts. The entire system is orchestrated by n8n workflows, deployed across four free-tier platforms, and costs **$0/month** to run.

---

## 🌐 Live Demo

| Service | URL | Description |
|---------|-----|-------------|
| Dashboard | [https://flowmind-ai.vercel.app](https://flowmind-ai.vercel.app) | React management dashboard |
| Backend API | [https://mansisonani07-flowmind-ai.hf.space](https://mansisonani07-flowmind-ai.hf.space) | FastAPI RAG engine |
| API Docs | [https://mansisonani07-flowmind-ai.hf.space/docs](https://mansisonani07-flowmind-ai.hf.space/docs) | Interactive Swagger UI |
| n8n Editor | [https://your-n8n-app.up.railway.app](https://your-n8n-app.up.railway.app) | Workflow automation |

---

## ❓ Problem It Solves

Small business owners spend hours every day answering the same repetitive questions on WhatsApp — "What are your hours?", "Do you have vegetarian options?", "How much does X cost?", "Where are you located?". This manual repetition is the single biggest time drain for solo entrepreneurs and small teams, directly eating into revenue-generating activities.

FlowMind AI eliminates this bottleneck by reading your existing business documents (menus, FAQs, price lists, service descriptions) and automatically responding to customers with accurate, sourced answers. There's no need to train a custom model or write complex prompts — just upload your PDF and the system is ready. When the AI isn't confident about an answer, it gracefully escalates to a human, so you never lose a customer to a bad automated response.

---

## ⚙️ How It Works

1. 📤 **Upload** your business documents (PDF menu, FAQ, price list) through the dashboard or API
2. 🧠 **Index** — AI reads and indexes your documents using sentence-transformer embeddings into ChromaDB
3. 📱 **Receive** — Customer sends a WhatsApp message to your business number via Twilio
4. 🔍 **Search** — AI converts the question to a vector and searches your documents for the best-matching chunks using cosine similarity
5. 🤖 **Respond** — Groq LLM (Llama 3.3 70B) generates a natural, accurate response with source citations, delivered instantly to the customer on WhatsApp
6. 🚨 **Escalate** — If confidence is below threshold (0.6), the system automatically sends a "let me connect you with a human" message and alerts the business owner on Telegram

---

## 🏗 Architecture

```
┌─────────────┐      ┌──────────────┐      ┌────────────────────┐      ┌─────────────────────┐
│  WhatsApp   │◄────►│   Twilio     │      │   Cloudflare       │      │        n8n          │
│  Customer   │      │   API        │─────►│   Worker           │─────►│  ┌───────────────┐  │
└─────────────┘      └──────┬───────┘      │   (Edge Proxy)     │      │  │ Webhook       │  │
│                          │              │   ✓ Twilio sig     │      │  │ Trigger       │  │
│                          │              │   ✓ Rate limit     │      │  └───────┬───────┘  │
│                          │              └────────────────────┘      │          │          │
│                          │                                            │          ▼          │
│                          │                                            │  ┌───────────────┐  │
│                          │                                            │  │ HTTP POST     │  │
│                          │                                            │  │ /api/query    │  │
│                          │                                            │  └───────┬───────┘  │
│                          │                                            └──────────┼──────────┘
│                          │                                                       │
│                          ▼                                                       ▼
│                   ┌──────────────┐      ┌──────────────────────────────────────────┐
│                   │  Twilio API  │◄─────│           FastAPI Backend                │
│                   │  (Reply)     │      │  ┌────────────┐  ┌──────────────────────┐  │
│                   └──────────────┘      │  │ ChromaDB   │  │ Groq LLM             │  │
│                                          │  │ (Vectors)  │  │ (Llama 3.3 70B)     │  │
│                                          │  └────────────┘  └──────────────────────┘  │
│                                          │  ┌────────────┐  ┌──────────────────────┐  │
│                                          │  │ Telegram   │  │ Google Sheets        │  │
│                                          │  │ (Alerts)   │  │ (Logging)            │  │
│                                          │  └────────────┘  └──────────────────────┘  │
│                                          └──────────────────────────────────────────┘
│
│                   ┌──────────────────────────────────────────────┐
│                   │            React Frontend (Vercel)            │
│                   │  Dashboard │ Documents │ Analytics │ Settings  │
│                   └──────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Backend** | FastAPI 0.115, Python 3.11 | Async API server with automatic OpenAPI docs |
| **Frontend** | React 19, TypeScript 5.6, Vite 6 | SPA dashboard with Tailwind CSS v4 |
| **Charts** | Recharts 2.13 | Analytics visualizations and KPI graphs |
| **Data Fetching** | TanStack Query v5, Axios | Server state management with auto-refetch |
| **Animations** | Framer Motion 11 | Smooth page transitions and micro-interactions |
| **Icons** | Lucide React | Consistent icon system across the dashboard |
| **LLM** | Groq (llama-3.3-70b-versatile) | Sub-200ms LLM inference for answer generation |
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 | 384-dim vectors for semantic search |
| **Vector DB** | ChromaDB 0.5 | Embedded vector store with cosine similarity |
| **Automation** | n8n | Visual workflow orchestration (no-code) |
| **WhatsApp** | Twilio WhatsApp API | Messaging channel for customer interaction |
| **Alerts** | Telegram Bot API | Escalation and report notifications |
| **Logging** | Google Sheets API | Persistent conversation logging |
| **Edge** | Cloudflare Workers | Edge proxy with signature verification |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Containerization** | Docker & Docker Compose | One-command local development setup |

---

## 🚀 Quick Start (Docker)

The fastest way to get FlowMind AI running. Docker Compose starts all three services (backend, frontend, n8n) with a single command.

```bash
# Clone the repository
git clone https://github.com/mansisonani07/flowmind-ai.git
cd flowmind-ai

# Create environment file and add your API keys
cp .env.example .env
# Edit .env — at minimum set GROQ_API_KEY=gsk_your_key_here

# Start all services
docker-compose up --build
```

Once the containers are running, access the services:

| Service | URL |
|---------|-----|
| **Frontend Dashboard** | http://localhost:3000 |
| **Backend API** | http://localhost:8000 |
| **n8n Editor** | http://localhost:5678 |
| **Swagger API Docs** | http://localhost:8000/docs |
| **ReDoc API Docs** | http://localhost:8000/redoc |

> **Default n8n login**: username `admin`, password `flowmind_admin`

To stop all services: `docker-compose down`

To rebuild after code changes: `docker-compose up --build`

---

## 🔧 Manual Setup

### Prerequisites

- **Python 3.11+** — [python.org](https://www.python.org/downloads/) or `pyenv install 3.11`
- **Node.js 20+** — [nodejs.org](https://nodejs.org/) or `nvm install 20`
- **Docker** — [docker.com](https://www.docker.com/get-started) (only needed for n8n)
- **Git** — [git-scm.com](https://git-scm.com/)

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file and configure
cp .env.example .env
# Edit .env with your API keys (GROQ_API_KEY is required)

# Start the development server
python -m uvicorn app.main:app --reload --port 8000
```

The backend starts at http://localhost:8000 with demo mode enabled by default, which auto-loads sample restaurant, clinic, and coaching PDFs from `backend/demo_data/`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# (Optional) Create environment file
cp .env.example .env
# Set VITE_API_URL if backend is not on port 8000

# Start the development server
npm run dev
```

The dashboard starts at http://localhost:3000 with hot module replacement.

### n8n (Docker)

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=flowmind_admin \
  n8nio/n8n
```

Then open http://localhost:5678 and import the workflow JSON files from `n8n-workflows/`:
- `01-whatsapp-query-handler.json`
- `02-document-ingestion.json`
- `03-daily-summary.json`
- `04-weekly-analytics.json`

---

## ☁️ Deployment

FlowMind AI is designed to run on **4 free-tier platforms for $0/month**. Each platform hosts one component of the system.

| Platform | Purpose | Free Tier | Link |
|----------|---------|-----------|------|
| **HuggingFace Spaces** | Backend API (Docker) | 2 vCPU, 16GB RAM | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#1-huggingface-spaces-backend) |
| **Railway** | n8n Automation | 500 hrs/month, 512MB RAM | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#2-railway-n8n) |
| **Vercel** | Frontend Dashboard | 100GB bandwidth, global CDN | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#3-vercel-frontend) |
| **Cloudflare Workers** | Edge Proxy | 100k requests/day | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#4-cloudflare-workers-edge-proxy) |

👉 See the complete step-by-step deployment guide: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

---

## 📡 API Documentation

The FastAPI backend exposes a RESTful API with automatic Swagger documentation. For the full reference, see **[docs/API_REFERENCE.md](docs/API_REFERENCE.md)**.

### Upload a Document

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@restaurant_menu.pdf"
```

**Response:**
```json
{
  "status": "success",
  "filename": "restaurant_menu.pdf",
  "chunks_created": 47
}
```

### Query the RAG System

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are your opening hours?",
    "user_phone": "+1234567890"
  }'
```

**Response:**
```json
{
  "answer": "We are open Monday to Saturday, 9:00 AM to 10:00 PM, and Sunday 10:00 AM to 8:00 PM.",
  "sources": [
    {
      "filename": "restaurant_menu.pdf",
      "page": 1,
      "text": "Opening Hours: Mon-Sat 9AM-10PM, Sun 10AM-8PM..."
    }
  ],
  "confidence": 0.89,
  "escalated": false,
  "chunks_used": 3,
  "response_time_ms": 342.15
}
```

### Health Check

```bash
curl http://localhost:8000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "services": {
    "chromadb": true,
    "groq": true,
    "sheets": false,
    "telegram": false
  },
  "uptime_seconds": 5.2
}
```

---

## 🔀 n8n Workflows

FlowMind AI ships with 4 pre-built n8n workflows. Import them into your n8n instance and activate them. For full details, see **[docs/N8N_WORKFLOWS.md](docs/N8N_WORKFLOWS.md)**.

| # | Workflow | File | Purpose |
|---|----------|------|---------|
| 01 | **WhatsApp Query Handler** | `n8n-workflows/01-whatsapp-query-handler.json` | Receives incoming WhatsApp messages via Twilio webhook, extracts the question and sender phone, queries the FastAPI `/api/query` endpoint, sends the AI response back via Twilio, and escalates to Telegram when confidence is low |
| 02 | **Document Ingestion** | `n8n-workflows/02-document-ingestion.json` | Processes document upload requests, forwards PDF files to the FastAPI `/api/upload` endpoint, and sends confirmation alerts to Telegram with document details |
| 03 | **Daily Summary** | `n8n-workflows/03-daily-summary.json` | Cron-triggered every day at 9 PM UTC. Fetches stats from the FastAPI `/api/stats` endpoint, formats a summary of daily conversations, confidence scores, and escalation count, and sends it to the admin via Telegram |
| 04 | **Weekly Analytics** | `n8n-workflows/04-weekly-analytics.json` | Cron-triggered every Monday at 9 AM UTC. Fetches weekly analytics, generates a detailed report with trend comparisons, and sends it to the admin via Telegram and optionally to email |

---

## ✨ Features

### Core RAG Engine
- 🤖 **Automated WhatsApp Support** — Responds to customer queries instantly using your business documents
- 📄 **PDF Document Ingestion** — Upload menus, FAQs, price lists, service descriptions as PDFs
- 🔢 **Vector Similarity Search** — Uses sentence-transformer embeddings (384-dim) for semantic search across all documents
- 📊 **Confidence Scoring** — Every response includes a confidence score (0.0–1.0) based on chunk similarity distances
- 🚨 **Automatic Human Escalation** — When confidence drops below 0.6, the customer is told a human will follow up and the business owner is alerted on Telegram
- 📝 **Source Citations** — Every answer includes which document and page the information came from, building customer trust
- 🧩 **Configurable Chunking** — Adjustable chunk size (default 500 chars) and overlap (default 50 chars) for optimal retrieval

### LLM & Intelligence
- ⚡ **Groq LLM** — Sub-200ms inference with Llama 3.3 70B for high-quality, natural-language answer generation
- 🔄 **Automatic Retries** — Exponential backoff retry logic handles Groq rate limits (429 responses) gracefully
- 🎯 **Top-K Retrieval** — Configurable number of context chunks (default 3) fed to the LLM for grounded responses

### Dashboard & Frontend
- 📈 **Real-time Analytics** — Interactive charts powered by Recharts showing conversation volume, confidence trends, and escalation rates
- 🌙 **Dark Mode** — Full dark mode with system preference detection and manual toggle
- 📱 **Responsive Design** — Mobile-first layout with drawer navigation that works on phones, tablets, and desktops
- 📂 **Document Management** — Upload, view, and delete documents directly from the dashboard
- 💬 **Conversation Viewer** — Browse all logged conversations with search and filtering
- ⚙️ **Settings Panel** — Configure confidence threshold, chunk size, and other parameters from the UI

### Infrastructure & Operations
- 🔐 **Twilio Signature Verification** — Cloudflare Worker validates HMAC-SHA1 signatures at the edge, rejecting spoofed requests before they reach n8n
- ⏱ **Per-Phone Rate Limiting** — 20 requests/minute per phone number enforced via Cloudflare KV and FastAPI middleware
- 📋 **Google Sheets Logging** — Every conversation is logged to a Google Spreadsheet with timestamp, phone, question, answer, confidence, and escalation status
- 📢 **Telegram Notifications** — Real-time alerts for escalations, document uploads, and scheduled reports
- 📊 **Scheduled Reports** — Daily summary (9 PM UTC) and weekly analytics (Monday 9 AM UTC) delivered to Telegram
- 🐳 **Docker Compose** — One-command local development with all services (backend, frontend, n8n) started together
- 🔄 **CI/CD** — GitHub Actions for automated testing and deployment
- 📡 **Edge Proxy** — Cloudflare Workers handles CORS, rate limiting, and signature verification at 300+ global edge locations

---

## 📁 Project Structure

```
flowmind-ai/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py              # Pydantic Settings (env vars, defaults)
│   │   ├── main.py                # FastAPI app, lifespan, CORS, middleware
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic v2 request/response models
│   │   ├── routes/                # API endpoint modules
│   │   │   ├── health.py           # GET /api/health
│   │   │   ├── upload.py           # POST /api/upload
│   │   │   ├── query.py            # POST /api/query
│   │   │   ├── documents.py        # GET/DELETE /api/documents
│   │   │   └── stats.py            # GET /api/stats
│   │   ├── services/              # Core business logic
│   │   │   ├── rag_engine.py       # RAG orchestrator (ingest + query)
│   │   │   ├── embedder.py         # sentence-transformers wrapper
│   │   │   ├── groq_client.py      # Groq LLM with retry logic
│   │   │   ├── document_processor.py  # PDF extraction, text chunking
│   │   │   └── telegram_notifier.py   # Telegram alert sender
│   │   ├── database/              # Data layer
│   │   │   ├── chroma_client.py    # ChromaDB vector operations
│   │   │   └── sheets_client.py    # Google Sheets conversation logger
│   │   ├── middleware/
│   │   │   └── rate_limiter.py     # Sliding-window rate limiter
│   │   └── utils/
│   │       ├── logger.py          # Structured logging setup
│   │       └── cache.py            # Thread-safe TTL cache with LRU
│   ├── tests/                     # pytest test suite
│   │   ├── conftest.py            # Shared fixtures
│   │   ├── test_routes.py         # API endpoint tests
│   │   ├── test_embedder.py       # Embedding model tests
│   │   └── test_rag_engine.py     # RAG engine logic tests
│   ├── scripts/
│   │   └── create_sample_pdfs.py  # Demo PDF generator (ReportLab)
│   ├── Dockerfile                 # Multi-stage Python build
│   ├── requirements.txt           # Pinned Python dependencies
│   └── pytest.ini                 # Pytest configuration
├── frontend/
│   ├── src/
│   │   ├── main.tsx               # React entry point
│   │   ├── App.tsx                # Router + QueryClient setup
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── Home.tsx           # Dashboard with stats + recent activity
│   │   │   ├── Documents.tsx      # Document upload and management
│   │   │   ├── Conversations.tsx  # Conversation log viewer
│   │   │   ├── Analytics.tsx      # Charts and analytics dashboard
│   │   │   └── Settings.tsx       # Configuration panel
│   │   ├── components/
│   │   │   ├── layout/            # Layout, Sidebar, Header
│   │   │   ├── dashboard/         # StatsCard, ChartCard, ConversationCard, RecentActivity
│   │   │   ├── documents/         # UploadZone, DocumentList, DocumentCard
│   │   │   └── ui/                # Button, Card, Badge, Modal, Loading
│   │   ├── hooks/                 # useTheme, useDocuments, useStats
│   │   ├── context/               # ThemeContext (dark/light/system)
│   │   ├── lib/                   # api.ts (Axios client), utils.ts
│   │   └── types/                 # TypeScript interfaces
│   ├── public/
│   │   └── favicon.svg
│   ├── index.html
│   ├── vite.config.ts             # Vite + React plugin
│   ├── vercel.json                # Vercel deployment config
│   ├── tsconfig.json
│   └── package.json
├── cloudflare-worker/
│   ├── src/
│   │   └── index.ts              # Edge proxy: Twilio verify + rate limit + forward
│   ├── wrangler.toml              # Cloudflare Workers config
│   └── package.json
├── n8n-workflows/
│   ├── 01-whatsapp-query-handler.json
│   ├── 02-document-ingestion.json
│   ├── 03-daily-summary.json
│   └── 04-weekly-analytics.json
├── docs/
│   ├── ARCHITECTURE.md            # System architecture deep dive
│   ├── API_REFERENCE.md           # Full API endpoint reference
│   ├── SETUP_GUIDE.md             # Step-by-step installation guide
│   ├── DEPLOYMENT.md              # 4-platform deployment guide
│   ├── N8N_WORKFLOWS.md           # Workflow documentation
│   ├── TROUBLESHOOTING.md         # Common issues and fixes
│   └── ROADMAP.md                 # Version roadmap
├── docker-compose.yml             # Local dev: backend + frontend + n8n
├── docker-compose.prod.yml        # Production configuration
├── CONTRIBUTING.md                # Contribution guidelines
├── LICENSE                       # MIT License
└── README.md                     # This file
```

---

## 🧪 Testing

### Backend Tests (pytest)

```bash
cd backend
pip install -r requirements.txt  # includes pytest + pytest-asyncio
pytest -v
```

The test suite includes:

| Test File | What It Tests |
|-----------|--------------|
| `test_routes.py` | Health endpoint returns 200, query endpoint validates input, upload rejects non-PDF files |
| `test_embedder.py` | Embedding output is 384-dimensional, batch processing works correctly, empty text is handled |
| `test_rag_engine.py` | High-confidence queries return answers, low-confidence queries trigger escalation, confidence is clamped to [0, 1] |

### Frontend Build Check

```bash
cd frontend
npm install
npm run build
```

This runs TypeScript type checking (`tsc -b`) and the Vite production build. A successful build confirms there are no type errors and the application compiles correctly.

### Docker Health Check

When running via Docker Compose, the backend container includes a health check:

```bash
docker-compose ps  # Shows health status of all services
```

---

## 🗺 Roadmap

See the full versioned roadmap: **[docs/ROADMAP.md](docs/ROADMAP.md)**

| Version | Focus | Key Features |
|---------|-------|-------------|
| v1.1 | Multi-Modal & Multi-Language | Language detection, voice message transcription, image OCR |
| v1.2 | Expanded Integrations | Instagram DM, CRM (HubSpot/Zoho), official WhatsApp Business API |
| v2.0 | Team & Multi-Tenant | JWT auth, role-based access, multi-business SaaS, model fine-tuning |
| v2.1 | Mobile & Analytics | React Native app, sentiment analysis, A/B testing, exportable reports |
| v3.0 | Enterprise & Platform | Terraform deployment, SSO/SOC 2, API marketplace |

---

## 🤝 Contributing

Contributions are welcome! Please see **[CONTRIBUTING.md](CONTRIBUTING.md)** for guidelines on:

- Reporting bugs (with template)
- Suggesting features
- Submitting pull requests (conventional commits)
- Code style (Python PEP 8, TypeScript strict)
- Testing requirements

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [**Groq**](https://groq.com) — Blazing-fast LPU-based LLM inference that makes real-time WhatsApp responses possible
- [**n8n**](https://n8n.io) — Powerful visual workflow automation that lets non-technical users customize the pipeline
- [**sentence-transformers**](https://www.sbert.net) — Excellent open-source embedding models that make semantic search accessible
- [**Twilio**](https://www.twilio.com) — Reliable WhatsApp Business API with webhook infrastructure
- [**HuggingFace**](https://huggingface.co) — Free Docker Spaces hosting that makes this project possible at $0/month
- [**Cloudflare**](https://workers.cloudflare.com) — Global edge network for signature verification and rate limiting
- [**Vercel**](https://vercel.com) — Instant frontend deployments with global CDN and automatic SSL
- [**Railway**](https://railway.app) — Simple container hosting with persistent volumes for n8n
- [**ChromaDB**](https://www.trychroma.com) — Lightweight embedded vector database perfect for small-business use cases
- [**Vite**](https://vite.dev) — Next-generation frontend build tool with instant HMR
- [**React**](https://react.dev) — The UI library that powers the dashboard
- [**FastAPI**](https://fastapi.tiangolo.com) — Modern Python web framework with automatic OpenAPI documentation

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/mansisonani07">Mansi Sonani</a>
</p>
