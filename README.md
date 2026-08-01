<div align="center">

# ⚡ FlowMind AI

**Intelligent Document Analysis & RAG-Powered Conversational AI**

[![Live Frontend](https://img.shields.io/badge/Frontend-Live-success?style=for-the-badge&logo=vercel)](https://flowmind-ai-frontend.onrender.com)
[![Live Backend](https://img.shields.io/badge/Backend-Live-blue?style=for-the-badge&logo=fastapi)](https://flowmind-ai-backend-n2a4.onrender.com)
[![Health Check](https://img.shields.io/badge/API-Healthy-brightgreen?style=for-the-badge)](https://flowmind-ai-backend-n2a4.onrender.com/health)
[![Demo Mode](https://img.shields.io/badge/Demo-Ready-orange?style=for-the-badge)](https://flowmind-ai-frontend.onrender.com)

</div>

---

## 🌐 Live Demo

| Service | URL | Status |
|---------|-----|--------|
| **Frontend App** | [https://flowmind-ai-frontend.onrender.com](https://flowmind-ai-frontend.onrender.com) | ✅ Live |
| **Backend API** | [https://flowmind-ai-backend-n2a4.onrender.com](https://flowmind-ai-backend-n2a4.onrender.com) | ✅ Live |
| **Health Check** | [https://flowmind-ai-backend-n2a4.onrender.com/health](https://flowmind-ai-backend-n2a4.onrender.com/health) | ✅ Live |
| **API Docs** | [https://flowmind-ai-backend-n2a4.onrender.com/docs](https://flowmind-ai-backend-n2a4.onrender.com/docs) | ✅ Live |
| **API Redoc** | [https://flowmind-ai-backend-n2a4.onrender.com/redoc](https://flowmind-ai-backend-n2a4.onrender.com/redoc) | ✅ Live |

> 💡 **Tip:** The frontend runs in **Demo Mode** by default — no backend connection needed to explore the full UI!

---

## 🎯 Overview

FlowMind AI is a full-stack **RAG (Retrieval-Augmented Generation)** platform that lets you upload documents, automatically chunks and indexes them using vector embeddings, and enables intelligent conversational AI powered by **Groq's LLM**. Ask questions about your documents and get accurate, context-aware answers.

### ✨ Key Features

- 📄 **Smart Document Upload** — Upload PDF, TXT, MD, and other text files for automatic processing
- 🔍 **RAG-Powered Q&A** — Ask questions and get answers grounded in your uploaded documents
- 🧠 **Intelligent Chunking** — Documents are automatically split into optimized chunks for retrieval
- 📊 **Real-time Analytics** — Track usage statistics, document counts, and query metrics
- 💻 **Playground Mode** — Test prompts and explore AI capabilities interactively
- 📋 **Insights Dashboard** — Visualize document analysis, conversation patterns, and trends
- 📱 **Fully Responsive** — Works seamlessly on desktop, tablet, and mobile devices
- 🔒 **Demo Mode** — Full UI exploration without any backend connection required
- 🚀 **One-Click Deploy** — Deployed separately on Render.com with zero-config setup

---

## 🚀 Tech Stack

### Frontend

| Technology | Purpose |
|-----------|----------|
| ⚛️ **React 18** | UI framework |
| ⚡ **Vite** | Build tool & dev server |
| 🎨 **Tailwind CSS** | Utility-first styling |
| 📦 **React Router v6** | Client-side routing |
| 🔄 **Framer Motion** | Animations & transitions |
| 📝 **ReactMarkdown** | Markdown rendering |
| 💡 **Lucide React** | Icon library |
| ✨ **Recharts** | Data visualization charts |
| 🧩 **Axios** | HTTP client |

### Backend

| Technology | Purpose |
|-----------|----------|
| ⚛️ **Python 3.11** | Runtime |
| ⚡ **FastAPI** | Web framework |
| 🔄 **Uvicorn** | ASGI server |
| 🧠 **Groq SDK** | LLM inference (Llama, Mixtral, Gemma) |
| 🔍 **ChromaDB** | Vector database for embeddings |
| 📌 **Pydantic v2** | Data validation & settings |
| 📤 **python-multipart** | File upload handling |
| 🔍 **tiktoken** | Token counting for chunking |
| 📜 **langchain-text-splitters** | Intelligent text splitting |

---

## 🌐 Architecture

```
▐────────────────────────────────────────────────────────▒
│  FlowMind AI - System Architecture                           │
▐────────────────────────────────────────────────────────▒

  ┌──────────────────────┐     HTTPS      ┌──────────────────────┐
  │   React Frontend    │ ───────>│   FastAPI Backend    │
  │   (Vite + TW)     │              │   (Python 3.11)     │
  └────────────────┘              └────────────────┘
  flowmind-ai-frontend.onrender.com  flowmind-ai-backend-n2a4.onrender.com
                                       │
                              ┌──────────────┤
                              │                        │
                     ┌────────────┐  ┌────────────┐  ┌────────────┐
                     │   ChromaDB      │  │   Groq LLM      │  │  File Storage   │
                     │  (Vector DB)    │  │  (AI Engine)    │  │   (/tmp)        │
                     └────────────┘  └────────────┘  └────────────┘
```

---

## 📁 Project Structure

```
flowmind-ai/
├── backend/
│   ├── app/
│   │   ├── config.py              # App settings & environment config
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── models/                  # Pydantic data models
│   │   │   └── schemas.py
│   │   ├── services/                # Business logic
│   │   │   ├── rag_engine.py          # RAG: chunking, embedding, retrieval
│   │   │   ├── llm_service.py         # Groq LLM integration
│   │   │   └── conversation_service.py # Chat history management
│   │   ├── routes/                  # API endpoints
│   │   │   ├── query.py               # /api/query - Ask questions
│   │   │   ├── upload.py              # /api/upload - Upload documents
│   │   │   ├── documents.py           # /api/documents - Manage docs
│   │   │   ├── conversations_advanced.py # /api/conversations - Chat
│   │   │   ├── playground.py           # /api/playground - Test prompts
│   │   │   ├── stats.py               # /api/stats - Usage stats
│   │   │   └── insights.py            # /api/insights - Analytics
│   │   └── middleware/
│   ├── requirements.txt          # Python dependencies
│   └── run.py                   # Uvicorn runner
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/             # React UI components
│   │   ├── pages/                  # Page-level components
│   │   ├── services/                # API client services
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── context/                 # React context providers
│   │   ├── utils/                  # Utility functions
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── postcss.config.js
│
└── README.md
```

---

## 📥 Getting Started (Local Development)

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **Python** 3.11+
- A [Groq API Key](https://console.groq.com/) (free tier available)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/flowmind-ai.git
cd flowmind-ai
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GROQ_API_KEY="your_groq_api_key_here"
export CHROMA_PERSIST_DIR="./chroma_db"

# Run the server
python run.py
```

Backend runs at → `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start dev server
npm run dev
```

Frontend runs at → `http://localhost:5173`

### 4. Environment Variables

| Variable | Backend | Frontend | Default | Description |
|----------|---------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ | ❌ | `""` | Your Groq API key for LLM |
| `CHROMA_PERSIST_DIR` | ✅ | ❌ | `/tmp/chroma_db` | Vector DB storage path |
| `VITE_API_URL` | ❌ | ✅ | Auto-detected | Backend API base URL |
| `VITE_DEMO_MODE` | ❌ | ✅ | `false` | Run frontend without backend |
| `PORT` | ✅ | ❌ | `8000` / `10000` | Server port |
| `PYTHON_VERSION` | ✅ | ❌ | `3.11.7` | Python version (Render) |

---

## 🚀 Deployment on Render.com

Both frontend and backend are deployed as **separate Web Services** on Render.

### Backend Service

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `cd backend && python run.py` |
| **Environment** | `PYTHON_VERSION=3.11.7` |
| **Live URL** | [flowmind-ai-backend-n2a4.onrender.com](https://flowmind-ai-backend-n2a4.onrender.com) |

#### Required Environment Variables

```
GROQ_API_KEY=gsk_your_key_here
CHROMA_PERSIST_DIR=/tmp/chroma_db
PYTHON_VERSION=3.11.7
```

### Frontend Service

| Setting | Value |
|---------|-------|
| **Service Type** | Web Service |
| **Runtime** | Node.js |
| **Build Command** | `npm install --legacy-peer-deps && npm run build` |
| **Start Command** | `npx serve dist -s -l $PORT` |
| **Environment** | `VITE_API_URL=https://flowmind-ai-backend-n2a4.onrender.com` |
| **Live URL** | [flowmind-ai-frontend.onrender.com](https://flowmind-ai-frontend.onrender.com) |

#### Required Environment Variables

```
VITE_API_URL=https://flowmind-ai-backend-n2a4.onrender.com
VITE_DEMO_MODE=true
```

### ⚠️ Important Deployment Notes

1. **Python Version**: Always set `PYTHON_VERSION=3.11.7` — Python 3.14 lacks pre-built wheels for `pydantic-core` and will fail to compile
2. **ChromaDB Path**: Must be `/tmp/chroma_db` — Render's filesystem is read-only except `/tmp`
3. **Legacy Peer Deps**: Always use `npm install --legacy-peer-deps` for the frontend
4. **Static Serving**: Use `npx serve dist -s -l $PORT` — React build produces static files
5. **Demo Mode**: Set `VITE_DEMO_MODE=true` to make the frontend fully functional without backend

---

## 📞 API Reference

### Base URL
```
https://flowmind-ai-backend-n2a4.onrender.com
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check & service status |
| `POST` | `/api/upload` | Upload a document (PDF, TXT, MD) |
| `GET` | `/api/documents` | List all uploaded documents |
| `DELETE` | `/api/documents/{doc_id}` | Delete a document & its chunks |
| `GET` | `/api/documents/{doc_id}/chunks` | Get chunks for a document |
| `POST` | `/api/query` | Ask a question (RAG-powered) |
| `GET` | `/api/conversations` | List all conversations |
| `GET` | `/api/conversations/{id}/messages` | Get conversation messages |
| `POST` | `/api/playground` | Test AI prompts directly |
| `GET` | `/api/stats` | Get usage statistics |
| `GET` | `/api/insights` | Get analytics & insights |
| `GET` | `/docs` | Interactive Swagger UI |
| `GET` | `/redoc` | Alternative API documentation |

### Example: Upload a Document

```bash
curl -X POST https://flowmind-ai-backend-n2a4.onrender.com/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

### Example: Query Documents

```bash
curl -X POST https://flowmind-ai-backend-n2a4.onrender.com/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the key findings?",
    "conversation_id": null
  }'
```

### Example: Health Check

```bash
curl https://flowmind-ai-backend-n2a4.onrender.com/health
```

---

## 📄 How It Works

### Document Processing Pipeline

```
Upload Document → Extract Text → Split into Chunks → Generate Embeddings → Store in ChromaDB
```

1. **Upload**: User uploads a document via the frontend
2. **Extraction**: Text is extracted from the file (PDF, TXT, MD)
3. **Chunking**: Text is split into optimized chunks using `langchain-text-splitters`
4. **Embedding**: Each chunk is converted to a vector embedding
5. **Storage**: Embeddings are stored in ChromaDB for fast retrieval

### Query Pipeline

```
User Question → Embed Query → Retrieve Relevant Chunks → Build Context → Groq LLM → Answer
```

1. **Question**: User asks a question about their documents
2. **Embed**: The question is converted to an embedding
3. **Retrieve**: Similar chunks are fetched from ChromaDB
4. **Context**: Retrieved chunks form the context for the LLM
5. **Generate**: Groq LLM generates an answer based on the context

---

## 🌐 Live Links Quick Reference

```
███████████████████████████████████████████████████

  ▶  Frontend:    https://flowmind-ai-frontend.onrender.com
  ▶  Backend:     https://flowmind-ai-backend-n2a4.onrender.com
  ▶  Health:      https://flowmind-ai-backend-n2a4.onrender.com/health
  ▶  API Docs:    https://flowmind-ai-backend-n2a4.onrender.com/docs
  ▶  Redoc:       https://flowmind-ai-backend-n2a4.onrender.com/redoc

███████████████████████████████████████████████████
```

---

## 🏆 Features in Detail

### 📄 Smart Document Upload
Upload PDF, TXT, and Markdown files. Documents are automatically parsed, chunked into optimal sizes, and indexed with vector embeddings for instant retrieval. Supports batch uploads and provides real-time progress feedback.

### 💬 Conversational AI
Multi-turn conversations powered by Groq's lightning-fast LLM. Context from your documents is automatically retrieved and injected into prompts, ensuring accurate and grounded responses. Full conversation history is maintained.

### 📊 Analytics Dashboard
Real-time statistics including total documents, chunks indexed, queries processed, and conversation counts. Visual charts show usage trends and document distribution.

### 🧩 AI Playground
Test and experiment with AI prompts directly. Adjust parameters, try different models, and see instant results without uploading documents.

### 📱 Responsive Design
Built mobile-first with Tailwind CSS. Every page adapts beautifully from mobile phones to ultrawide monitors. Touch-optimized interactions and smooth animations throughout.

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Set `PYTHON_VERSION=3.11.7` — Python 3.14 breaks pydantic-core |
| ChromaDB error | Set `CHROMA_PERSIST_DIR=/tmp/chroma_db` — Render FS is read-only |
| Frontend build fails | Use `npm install --legacy-peer-deps` |
| API returns 503 | RAG engine not initialized — check GROQ_API_KEY is set |
| Documents not persisting | ChromaDB uses `/tmp` which resets on redeploy — expected behavior |
| Frontend shows nothing | Set `VITE_API_URL` to your backend URL, or enable `VITE_DEMO_MODE=true` |

---

## 💻 Development

### Run Backend Tests

```bash
cd backend
pytest
```

### Run Frontend Tests

```bash
cd frontend
npm test
```

### Lint & Format

```bash
# Backend
cd backend && black . && isort .

# Frontend
cd frontend && npx eslint src/ && npx prettier --write src/
```

---

## 👤 Author

Built with ❤️ by **FlowMind AI Team**

---

## 📦 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ⚡ by FlowMind AI**

[Live Frontend](https://flowmind-ai-frontend.onrender.com) • [Live Backend](https://flowmind-ai-backend-n2a4.onrender.com) • [API Docs](https://flowmind-ai-backend-n2a4.onrender.com/docs)

</div>
