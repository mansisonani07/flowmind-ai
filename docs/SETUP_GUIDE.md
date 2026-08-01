# Setup Guide

Complete step-by-step instructions to get FlowMind AI running on your local machine. This guide covers prerequisites, API key setup, Docker installation, manual setup for each component, verification steps, sample data generation, and troubleshooting common issues.

---

## Prerequisites

Before you begin, install these tools on your development machine. FlowMind AI requires all four to be installed for the full local development experience.

| Tool | Minimum Version | Recommended | Installation | Verification |
|------|----------------|-------------|--------------|--------------|
| **Python** | 3.11 | 3.11.x | [python.org](https://www.python.org/downloads/) or `pyenv install 3.11` | `python --version` |
| **Node.js** | 20.0 | 20.x LTS | [nodejs.org](https://nodejs.org/) or `nvm install 20` | `node --version` |
| **Docker** | 24.0 | Latest | [docker.com/get-started](https://www.docker.com/get-started) | `docker --version` |
| **Git** | 2.30 | Latest | [git-scm.com](https://git-scm.com/) | `git --version` |

### Platform-Specific Notes

**macOS**: Install Docker Desktop. For Python, use Homebrew (`brew install python@3.11`) or pyenv. For Node.js, use `brew install node` or nvm.

**Windows**: Install Docker Desktop with WSL2 backend. For Python, download the installer from python.org and check "Add Python to PATH". For Node.js, download the MSI installer or use nvm-windows.

**Linux (Ubuntu/Debian)**: Install Docker via `curl -fsSL https://get.docker.com | sh`. Install Python via `sudo apt install python3.11 python3.11-venv python3-pip`. Install Node.js via nvm.

Verify all installations:

```bash
python --version   # Should be 3.11.x
node --version     # Should be 20.x.x
docker --version   # Should be 24.x.x or newer
git --version      # Should be 2.x.x
```

---

## Getting API Keys

FlowMind AI integrates with several external services. Only **Groq is strictly required** for the core RAG functionality. The other integrations (Twilio, Telegram, Google Sheets) are optional and can be enabled later.

### Groq API Key (Required)

Groq provides the LLM inference engine that powers answer generation. Without this key, the query endpoint will not work.

1. Go to [console.groq.com](https://console.groq.com) and create a free account using your email or Google/GitHub login.
2. Once logged in, navigate to **API Keys** in the left sidebar.
3. Click the **Create API Key** button.
4. Give the key a descriptive name (e.g., "FlowMind AI Backend").
5. Copy the generated key \u2014 it starts with `gsk_` and is approximately 60 characters long.
6. **Store it securely**. You will not be able to see it again after leaving the page.
7. This is your `GROQ_API_KEY` environment variable.

The free tier provides 30 requests per minute and 14,400 requests per day, which is sufficient for development and small-business use.

### Twilio WhatsApp (Required for WhatsApp Integration)

Twilio provides the WhatsApp Business API integration. You need a Twilio account to receive and send WhatsApp messages.

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio) and create a free account.
2. Verify your phone number during sign-up (Twilio requires this for anti-fraud).
3. From the Twilio Console dashboard, note your **Account SID** \u2014 this is your `TWILIO_ACCOUNT_SID`. It looks like `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.
4. Go to **API Keys & Tokens > Auth Token** and click **Show**. Copy the token \u2014 this is your `TWILIO_AUTH_TOKEN`. Keep it secret.
5. Go to **Messaging > WhatsApp > Sandbox** to access the WhatsApp Sandbox. Note the sandbox phone number (e.g., `whatsapp:+14155238886`). This is your `TWILIO_PHONE_NUMBER`.
6. To test: open WhatsApp on your phone, send the join code (displayed in the sandbox) to the sandbox number. You are now in a conversation with your Twilio WhatsApp number.

**Note**: The Twilio Sandbox is free for testing. For production use, you need to apply for a verified WhatsApp Business sender through the Twilio Console.

### Telegram Bot Token (Optional \u2014 for Escalation Alerts)

Telegram is used to send escalation alerts and scheduled reports to the business owner.

1. Open Telegram and search for `@BotFather` (the official Telegram bot for creating bots).
2. Send the `/newbot` command.
3. Follow the prompts: choose a display name (e.g., "FlowMind Alerts") and a username (e.g., `flowmind_alerts_bot`, must end in "bot").
4. BotFather will respond with your bot token \u2014 this is your `TELEGRAM_BOT_TOKEN`. It looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`.
5. Send a test message to your new bot (just type "hello" and send it).
6. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in your browser.
7. Look for the `"chat":{"id":` field in the JSON response. This number is your `TELEGRAM_ADMIN_CHAT_ID`.

### Google Sheets (Optional \u2014 for Conversation Logging)

Google Sheets integration logs every conversation to a spreadsheet for analytics and record-keeping.

1. Go to [Google Cloud Console](https://console.cloud.google.com) and sign in with your Google account.
2. Click **Select a project** > **New Project** and create a project (e.g., "FlowMind AI").
3. In the project dashboard, go to **APIs & Services > Library**.
4. Search for **Google Sheets API** and click **Enable**.
5. Search for **Google Drive API** and click **Enable** (required for file discovery).
6. Go to **APIs & Services > Credentials**.
7. Click **Create Credentials > Service Account**.
8. Give the service account a name (e.g., "flowmind-logger") and click **Create and Continue**.
9. Click **Done** (skip optional roles).
10. In the service accounts list, click the email address of the account you just created.
11. Go to the **Keys** tab and click **Add Key > Create new key > JSON**.
12. Download the JSON file. The entire JSON content (as a string) is your `GOOGLE_CREDS_JSON`.
13. Create a new Google Spreadsheet with a sheet named "Conversations" and the following header row: `Timestamp, User Phone, Question, Answer, Confidence, Escalated, Sources, Response Time (ms)`.
14. Share the spreadsheet with the service account email (from step 10, looks like `flowmind-logger@project-id.iam.gserviceaccount.com`) with **Editor** access.
15. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`) \u2014 this is your `GOOGLE_SHEETS_ID`.

---

## Clone & Configure

### Clone the Repository

```bash
git clone https://github.com/mansisonani07/flowmind-ai.git
cd flowmind-ai
```

### Create Environment File

```bash
cp .env.example .env
```

### Edit the Environment File

Open `.env` in your preferred editor. At minimum, set the Groq API key:

```env
# Required - Groq LLM API key
GROQ_API_KEY=gsk_your_actual_key_here
```

For full WhatsApp integration with all features, add these additional keys:

```env
# Required for WhatsApp integration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

# Optional - Telegram escalation alerts and reports
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_ID=123456789

# Optional - Google Sheets conversation logging
GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_CREDS_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

### Optional Configuration

These environment variables have sensible defaults and typically do not need to be changed:

```env
# LLM model (default: llama-3.3-70b-versatile)
GROQ_MODEL=llama-3.3-70b-versatile

# Embedding model (default: all-MiniLM-L6-v2)
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Document chunking (default: 500 chars, 50 overlap)
CHUNK_SIZE=500
CHUNK_OVERLAP=50

# Confidence threshold for auto-response (default: 0.6)
CONFIDENCE_THRESHOLD=0.6

# Number of chunks to retrieve per query (default: 3)
TOP_K_RESULTS=3

# Load sample PDFs on startup (default: True)
DEMO_MODE=True

# CORS allowed origins (default: all)
CORS_ORIGINS=["*"]

# Log level (default: INFO)
LOG_LEVEL=INFO
```

---

## Docker Setup (Recommended)

Docker Compose starts all three services (backend, frontend, n8n) with a single command. This is the recommended way to run FlowMind AI locally because it ensures all services are configured consistently and can communicate with each other.

### Start All Services

```bash
docker-compose up --build
```

This command will:
1. Build the backend Docker image from `backend/Dockerfile` (Python 3.11-slim base)
2. Build the frontend Docker image from `frontend/` (Node 20-alpine base, multi-stage build)
3. Pull the official `n8nio/n8n:latest` image
4. Create a persistent volume for ChromaDB data at `./backend/chroma_db/`
5. Create a named volume `n8n_data` for n8n workflow persistence
6. Start all three services with the environment variables from `.env`
7. Configure the backend health check (curl to `/health` every 30 seconds)

First build takes approximately 3-5 minutes (depending on your internet speed) because it needs to download Python packages, Node.js packages, and the sentence-transformers model (~90 MB).

### Access the Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend Dashboard | http://localhost:3000 | React SPA with document management, analytics |
| Backend API | http://localhost:8000 | FastAPI RAG engine with Swagger docs |
| n8n Editor | http://localhost:5678 | Visual workflow editor (login: admin / flowmind_admin) |
| Swagger API Docs | http://localhost:8000/docs | Interactive API documentation and testing |
| ReDoc API Docs | http://localhost:8000/redoc | Alternative API documentation |

### Useful Docker Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (resets all data!)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# View logs for a specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs n8n

# Follow logs in real-time
docker-compose logs -f backend

# Check service health status
docker-compose ps
```

---

## Manual Setup

If you prefer to run services individually (useful during active development of a specific component):

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create and configure environment file
cp .env.example .env
# Edit .env with your GROQ_API_KEY and other keys

# Start the development server with auto-reload
python -m uvicorn app.main:app --reload --port 8000
```

**What happens at startup:**
- FastAPI creates the application with lifespan management
- The `RAGEngine` initializes: loads the sentence-transformers model (~2-3 seconds), connects to ChromaDB, creates the `GroqClient`
- If `DEMO_MODE=True` (default), the system loads sample PDFs from `backend/demo_data/` into ChromaDB
- The server starts accepting requests at http://localhost:8000

You should see the FlowMind ASCII art logo and startup messages in the terminal.

### Frontend

```bash
cd frontend

# Install Node.js dependencies
npm install

# (Optional) Create environment file if backend is on a different port
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000 if needed

# Start the Vite development server with hot module replacement
npm run dev
```

The frontend starts at http://localhost:3000 with hot module replacement (HMR). Changes to any React component or CSS file are reflected instantly in the browser without a full page reload.

### n8n (Docker)

n8n requires Docker because there is no simple npm-based local installation for the self-hosted version.

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=flowmind_admin \
  n8nio/n8n
```

After starting n8n:

1. Open http://localhost:5678 in your browser.
2. Log in with `admin` / `flowmind_admin`.
3. Click the **hamburger menu** (three horizontal lines) in the top-left corner.
4. Click **Import from File**.
5. Upload each JSON file from the `n8n-workflows/` directory:
   - `01-whatsapp-query-handler.json` \u2014 Main WhatsApp message handling
   - `02-document-ingestion.json` \u2014 Document upload and indexing
   - `03-daily-summary.json` \u2014 Daily stats at 9 PM UTC
   - `04-weekly-analytics.json` \u2014 Weekly report on Mondays at 9 AM UTC
6. **Activate each workflow** by opening it and clicking the **Active** toggle in the top-right corner.

---

## Verifying Installation

### 1. Check Backend Health

```bash
curl http://localhost:8000/api/health
```

Expected response:

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

- `chromadb: true` means ChromaDB is connected and the `flowmind_docs` collection exists
- `groq: true` means the Groq API key is valid and the model is accessible
- `sheets: false` is expected if you have not configured Google Sheets (optional)
- `telegram: false` is expected if you have not configured Telegram (optional)

### 2. Open the Dashboard

Open http://localhost:3000 in your browser. You should see:
- The FlowMind AI dashboard with stats cards
- If demo mode is enabled, the document count should show 3 documents (restaurant menu, clinic services, coaching FAQ)
- Click **Documents** in the sidebar to see the uploaded documents
- Click **Analytics** to see the analytics charts

### 3. Test a RAG Query

```bash
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are your opening hours?", "user_phone": "+1234567890"}'
```

You should receive a JSON response with an `answer`, `sources`, `confidence` score (should be > 0.6), and `escalated: false`.

### 4. Test Document Upload

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@/path/to/your/document.pdf"
```

You should receive `{"status": "success", "filename": "document.pdf", "chunks_created": N}`.

### 5. Check Docker Services (if using Docker)

```bash
docker-compose ps
```

All three services should show as "running" with the backend showing "healthy" status.

---

## Generating Sample Data

The project includes a script to generate 3 realistic sample PDFs for testing. These PDFs simulate real business documents that a restaurant, clinic, and coaching business would use.

```bash
cd backend

# Install ReportLab (required for PDF generation)
pip install reportlab

# Run the generator script
python scripts/create_sample_pdfs.py
```

This creates three PDF files in `backend/sample_data/` (or `backend/demo_data/`):

| File | Pages | Content |
|------|-------|---------|
| `restaurant_menu.pdf` | 10 pages | Complete restaurant menu with sections: appetizers, main courses, desserts, beverages, special dietary items, pricing, and a frequently asked questions section |
| `clinic_services.pdf` | 5 pages | Medical/dental clinic service list with consultation fees, treatment descriptions, insurance information, and operating hours |
| `coaching_faq.pdf` | 8 pages | Life/business coaching FAQ document with session packages, pricing, coaching philosophy, cancellation policy, and testimonials |

With `DEMO_MODE=True` in your `.env` (the default), these sample PDFs are automatically loaded into ChromaDB every time the backend starts. This means you can immediately test queries without uploading your own documents.

To regenerate the sample PDFs (e.g., if you want fresh data):

```bash
rm -rf backend/sample_data/*.pdf backend/demo_data/*.pdf
python backend/scripts/create_sample_pdfs.py
```

---

## Common Errors & Fixes

| Error | Cause | Solution |
|-------|-------|----------|
| `ModuleNotFoundError: No module named 'app'` | Running uvicorn from the wrong directory | Run from the `backend/` directory: `cd backend && python -m uvicorn app.main:app --reload` |
| `chromadb.db permission denied` | ChromaDB cannot write to the persist directory | Run `chmod -R 755 backend/chroma_db` or delete the directory and let it recreate: `rm -rf backend/chroma_db` |
| `Groq API error: 401` | Invalid or missing Groq API key | Verify `GROQ_API_KEY` in `.env` starts with `gsk_` and is a valid key from console.groq.com |
| `Groq API error: 429` | Rate limit exceeded on Groq free tier | Wait a few seconds and retry. The built-in retry logic handles this automatically for programmatic calls |
| `Port 8000 already in use` | Another process is using port 8000 | Kill the process: `lsof -ti:8000 | xargs kill` or use a different port: `--port 8001` |
| `Port 3000 already in use` | Another process is using port 3000 | Kill the process: `lsof -ti:3000 | xargs kill` |
| Frontend shows "Network Error" | CORS misconfiguration or wrong API URL | Check `VITE_API_URL` in `frontend/.env` matches the backend URL. For Docker, it should be `http://localhost:8000` |
| `n8n workflow not triggering` | Workflow is inactive in n8n | Open the workflow in the n8n UI and click the **Active** toggle in the top-right corner |
| `No text could be extracted from X` | PDF contains only images or is encrypted | Ensure the PDF contains selectable text (not scanned images). The system uses PyPDF2 which does not support OCR |
| `No chunks created from X` | PDF is too short or all blank pages | The PDF needs at least enough text to create one 500-character chunk. Check the PDF content |
| Docker build fails on pip install | Network issues or missing system dependencies | Ensure Docker has internet access. Try `docker-compose build --no-cache` |
| `sentence_transformers` download timeout | Slow internet when downloading the model (~90 MB) | The model downloads once and is cached. If it fails, retry. Pre-download: `python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"` |
| `Google Sheets API error 403` | Service account lacks access to the spreadsheet | Share the spreadsheet with the service account email (from JSON key file) and grant Editor access |
| `Telegram bot not sending messages` | Wrong chat ID or bot token | Send a message to your bot first, then check `https://api.telegram.org/bot<TOKEN>/getUpdates` to confirm the chat_id |
| Backend health shows `groq: false` | Groq API key is invalid or Groq API is down | Verify the key at console.groq.com. Check Groq status page: status.groq.com |
| Docker `port already allocated` | Port conflict with existing container | Stop existing containers: `docker-compose down` or kill conflicting processes |
| HF Spaces build times out | Downloading sentence-transformers model exceeds build timeout | Set `DEMO_MODE=False` or use a persistent volume for the model cache |
