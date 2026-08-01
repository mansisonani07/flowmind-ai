# Deployment Guide

Deploy FlowMind AI across 4 free-tier platforms for a total cost of **$0/month**. Each platform hosts one independent component of the system. This guide provides step-by-step instructions for each platform, including environment variable configuration and inter-service connectivity.

---

## Overview

FlowMind AI uses a distributed deployment model where each service runs on the platform best suited to its requirements. The four platforms were chosen specifically because they all offer free tiers that cover the needs of a small-business WhatsApp assistant.

| Platform | Component | Free Tier Specs | Estimated Monthly Cost | URL Pattern |
|----------|-----------|----------------|----------------------|-------------|
| **HuggingFace Spaces** | FastAPI Backend (Docker) | 2 vCPU, 16GB RAM, persistent disk | $0 | `username-flowmind-ai.hf.space` |
| **Railway** | n8n Automation | 500 hours/month, 512MB RAM | $0 (then $5/mo) | `app-name.up.railway.app` |
| **Vercel** | React Frontend | 100GB bandwidth, unlimited static sites | $0 | `flowmind-ai.vercel.app` |
| **Cloudflare Workers** | Edge Proxy | 100,000 requests/day, KV reads/writes | $0 | `flowmind-proxy.subdomain.workers.dev` |

### Deployment Order

Deploy in this order to ensure each service can be configured with the correct URLs of the services it depends on:

1. **HuggingFace Spaces** (backend) — no dependencies on other deployed services
2. **Railway** (n8n) — needs the HuggingFace Spaces backend URL
3. **Vercel** (frontend) — needs the HuggingFace Spaces backend URL
4. **Cloudflare Workers** (edge proxy) — needs the Railway n8n webhook URL

---

## 1. HuggingFace Spaces (Backend)

HuggingFace Spaces with the Docker SDK allows you to run any Docker container for free. This is where the FastAPI backend lives, handling PDF ingestion, vector search, and LLM inference.

### Why HuggingFace Spaces?

- Free Docker container hosting with 2 vCPUs and 16GB RAM
- Persistent disk that survives container restarts
- Automatic HTTPS with a `.hf.space` domain
- Built-in CI/CD: push to the Git repo and it rebuilds automatically
- Ideal for ML models since it runs on the same infrastructure as HuggingFace Model Hub

### Step 1: Create the Space

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space).
2. Set the Space name (e.g., `flowmind-ai`).
3. Select **Docker** as the SDK type.
4. Choose **Blank** template (not Gradio or Streamlit).
5. Select **Public** visibility (required for free tier).
6. Click **Create Space**.

### Step 2: Push the Backend Code

```bash
# Install the HuggingFace Hub CLI
pip install huggingface_hub

# Login to HuggingFace (opens browser for auth)
huggingface-cli login

# Clone the Space repository
git clone https://huggingface.co/spaces/YOUR_USERNAME/flowmind-ai
cd flowmind-ai

# Remove the default files
rm -f README.md  # or keep it, it won't interfere

# Copy the backend files into the Space directory
cp -r /path/to/flowmind-ai/backend/* .

# Commit and push to trigger the build
git add .
git commit -m "deploy: initial FlowMind AI backend"
git push
```

HuggingFace will automatically detect the Dockerfile and start building. You can watch the build logs in the **Logs** tab of your Space. First build takes 5-10 minutes due to pip package installation and the sentence-transformers model download (~90 MB).

### Step 3: Configure Environment Variables

1. Go to your Space page on HuggingFace.
2. Click the **Settings** tab.
3. Scroll to **Variables and secrets**.
4. Click **New secret** and add each variable:

| Variable | Value | Required |
|----------|-------|----------|
| `GROQ_API_KEY` | `gsk_your_actual_key` | **Yes** |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | No |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | No |
| `CHUNK_SIZE` | `500` | No |
| `CHUNK_OVERLAP` | `50` | No |
| `CONFIDENCE_THRESHOLD` | `0.6` | No |
| `TOP_K_RESULTS` | `3` | No |
| `DEMO_MODE` | `True` | No |
| `CORS_ORIGINS` | `["*"]` | No |
| `GOOGLE_SHEETS_ID` | Your spreadsheet ID | No |
| `GOOGLE_CREDS_JSON` | Your service account JSON | No |
| `TELEGRAM_BOT_TOKEN` | Your bot token | No |
| `TELEGRAM_ADMIN_CHAT_ID` | Your chat ID | No |

### Step 4: Verify the Deployment

Once the build completes (check the **Logs** tab), visit:

```
https://YOUR_USERNAME-flowmind-ai.hf.space/api/health
```

You should see a JSON health response with `"status": "ok"`. If you see errors, check the Logs tab for detailed error messages.

### Troubleshooting HuggingFace Spaces

- **Build timeout**: If the build exceeds the time limit, set `DEMO_MODE=False` and upload documents through the API after deployment instead.
- **Out of memory**: The free tier has 16GB RAM which is sufficient. If you hit memory limits, reduce `CHUNK_SIZE` or switch to a smaller embedding model.
- **Sleeping**: Free Spaces may go to sleep after inactivity. The first request after sleeping takes 30-60 seconds to wake up. This does not affect Twilio webhooks which have retry logic.

---

## 2. Railway (n8n)

Railway provides container hosting with persistent volumes, which is ideal for n8n since it needs to persist workflow definitions, credentials, and execution history across restarts.

### Why Railway?

- One-click Docker image deployment
- Persistent volumes for n8n data
- Free tier: 500 hours/month execution time, 512MB RAM
- Automatic HTTPS
- Environment variable management
- Easy to redeploy and scale

### Step 1: Create a New Project

1. Go to [railway.app](https://railway.app) and sign in with your GitHub account.
2. Click **New Project** in the dashboard.
3. Select **Deploy from Docker Image**.
4. Enter the image name: `n8nio/n8n:latest`.
5. Railway will pull the image and deploy it. This takes 1-2 minutes.
6. Note your Railway app URL (e.g., `flowmind-n8n-production.up.railway.app`).

### Step 2: Add a Persistent Volume

n8n stores all workflow definitions, credentials, and execution history in `/home/node/.n8n`. Without a persistent volume, this data is lost on every redeploy.

1. Click on your deployed service in the Railway dashboard.
2. Go to the **Volumes** tab.
3. Click **Create Volume**.
4. Set the mount path to `/home/node/.n8n`.
5. Click **Create**.

Railway will mount this volume to the n8n container. All n8n data is now persisted.

### Step 3: Configure Environment Variables

1. In your Railway service, go to the **Variables** tab.
2. Add the following environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `N8N_BASIC_AUTH_ACTIVE` | `true` | Yes |
| `N8N_BASIC_AUTH_USER` | `admin` | Yes |
| `N8N_BASIC_AUTH_PASSWORD` | *(choose a strong password)* | Yes |
| `WEBHOOK_URL` | `https://your-railway-app.up.railway.app/` | Yes |
| `FASTAPI_URL` | `https://YOUR_USERNAME-flowmind-ai.hf.space` | Yes |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | Yes (WhatsApp) |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | Yes (WhatsApp) |
| `TWILIO_PHONE_NUMBER` | `whatsapp:+14155238886` | Yes (WhatsApp) |
| `TELEGRAM_BOT_TOKEN` | Your bot token | No |
| `TELEGRAM_ADMIN_CHAT_ID` | Your chat ID | No |
| `GOOGLE_SHEETS_ID` | Your sheet ID | No |

### Step 4: Import and Activate Workflows

1. Open `https://your-railway-app.up.railway.app` in your browser.
2. Log in with the credentials you set in Step 3.
3. Click the **hamburger menu** (three lines) in the top-left corner.
4. Click **Import from File**.
5. Upload all four workflow JSON files from your local `n8n-workflows/` directory:
   - `01-whatsapp-query-handler.json`
   - `02-document-ingestion.json`
   - `03-daily-summary.json`
   - `04-weekly-analytics.json`
6. Open each workflow and click the **Active** toggle in the top-right corner.
7. In the WhatsApp Query Handler workflow, verify the HTTP Request node points to your `FASTAPI_URL` + `/api/query`.

### Step 5: Configure Twilio Webhook

1. Go to the [Twilio Console](https://www.twilio.com/console).
2. Navigate to **Messaging > WhatsApp > Sandbox Settings**.
3. Set **WHEN A MESSAGE COMES IN** to your Cloudflare Worker URL (from Step 4 below). If you are not using the Cloudflare Worker, set it to `https://your-railway-app.up.railway.app/webhook/whatsapp`.
4. Twilio will send a verification request to confirm the endpoint is working.

### Free Tier Limitations

- Railway free tier provides $5 of credit per month, after which the service pauses.
- 500 hours of execution per month (sufficient for a small business with moderate traffic).
- 512MB RAM (sufficient for n8n with a few workflows).
- The service may sleep after inactivity; first webhook after sleeping takes 10-20 seconds.

---

## 3. Vercel (Frontend)

Vercel provides the fastest way to deploy the React frontend as a static site with a global CDN. Deployment is automatic when you push to GitHub.

### Why Vercel?

- Zero-configuration React/Vite deployment
- Global CDN with automatic HTTPS
- Preview deployments for every pull request
- Free tier: 100GB bandwidth, unlimited sites
- Custom domain support (free)
- Edge functions for advanced routing

### Step 1: Connect Your GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New** > **Project**.
3. Select your `flowmind-ai` repository from the list.
4. Vercel will detect the frontend framework automatically.

### Step 2: Configure the Build

1. Set the **Root Directory** to `frontend` (click "Edit" next to the detected root directory).
2. Vercel should auto-detect these settings. If not, set them manually:

   | Setting | Value |
   |---------|-------|
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

3. Click **Deploy**.

Vercel will install dependencies, run the TypeScript build check, create a Vite production build, and deploy to its CDN. This typically takes 60-90 seconds.

### Step 3: Set Environment Variable

1. After deployment, go to your project **Settings** > **Environment Variables**.
2. Add:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://YOUR_USERNAME-flowmind-ai.hf.space` |

3. Click **Save** and then **Redeploy** (Deployments tab > latest > three dots > Redeploy).

The `VITE_API_URL` tells the frontend where to send API requests. Without this, the frontend defaults to `http://localhost:8000`, which won't work in production.

### Step 4: Custom Domain (Optional)

1. Go to project **Settings** > **Domains**.
2. Click **Add Domain** and enter your domain (e.g., `flowmind.yourdomain.com`).
3. Vercel will provide DNS records to add to your domain registrar.
4. Add the DNS records as instructed.
5. Vercel automatically provisions an SSL certificate via Let's Encrypt.

### Vercel Configuration File

The `frontend/vercel.json` file is pre-configured with:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures that all routes (e.g., `/documents`, `/analytics`, `/settings`) are handled by the React Router instead of returning 404 from the server.

---

## 4. Cloudflare Workers (Edge Proxy)

The Cloudflare Worker is the public-facing entry point for all WhatsApp webhook traffic. It validates Twilio signatures at the edge and enforces per-phone rate limiting before forwarding requests to n8n.

### Why Cloudflare Workers?

- Runs at 300+ edge locations worldwide for minimal latency
- Free tier: 100,000 requests/day, 100,000 KV reads/day
- Web Crypto API for HMAC-SHA1 signature verification (no external deps)
- KV storage for distributed rate limiting
- Sub-millisecond cold start
- Free automatic HTTPS

### Step 1: Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version
```

### Step 2: Authenticate

```bash
wrangler login
```

This opens a browser window for Cloudflare authentication. If you don't have a Cloudflare account, you can create one for free.

### Step 3: Create a KV Namespace

The rate limiter uses Cloudflare KV to store per-phone request counters.

```bash
# Navigate to the cloudflare-worker directory
cd cloudflare-worker

# Create a KV namespace
wrangler kv:namespace create "RATE_LIMIT_KV"
```

You will see output like:

```
{ id: "abc123def456ghi789jkl012mno345" }
```

### Step 4: Update Wrangler Configuration

Open `cloudflare-worker/wrangler.toml` and update the KV namespace ID:

```toml
name = "flowmind-webhook-proxy"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "abc123def456ghi789jkl012mno345"  # <-- Paste your actual ID here
```

Also update the n8n webhook URL:

```toml
[vars]
N8N_WEBHOOK_URL = "https://your-railway-app.up.railway.app/webhook/whatsapp"
```

### Step 5: Set the Twilio Auth Token Secret

The Twilio auth token must be stored as a Wrangler secret (not in the TOML file) for security:

```bash
wrangler secret put TWILIO_AUTH_TOKEN
# Wrangler will prompt you to enter the value. Paste your Twilio auth token.
# The value is encrypted and stored securely.
```

### Step 6: Deploy the Worker

```bash
wrangler deploy
```

Expected output:

```
 Published flowmind-webhook-proxy (1.23 sec)
   https://flowmind-webhook-proxy.your-subdomain.workers.dev
```

### Step 7: Update Twilio Webhook URL

1. Go to the [Twilio Console](https://www.twilio.com/console).
2. Navigate to **Messaging > WhatsApp > Sandbox Settings**.
3. Set **WHEN A MESSAGE COMES IN** to:
   ```
   https://flowmind-webhook-proxy.your-subdomain.workers.dev
   ```
4. Twilio will send a test POST request to verify the endpoint. The Worker will validate the signature and forward to n8n.

### Step 8: Test the Full Pipeline

1. Open WhatsApp and send a message to your Twilio sandbox number.
2. The message should flow: WhatsApp > Twilio > Cloudflare Worker > n8n > FastAPI > Groq > n8n > Twilio > WhatsApp.
3. You should receive an AI-generated response within 2-5 seconds.
4. Check the Cloudflare Worker logs: `wrangler tail`
5. Check the n8n execution log in the n8n UI.

---

## Environment Variables Reference

Complete reference of all environment variables used across all four services.

### Backend (FastAPI / HuggingFace Spaces)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `GROQ_API_KEY` | string | — | **Yes** | Groq API key for LLM inference (starts with `gsk_`) |
| `GROQ_MODEL` | string | `llama-3.3-70b-versatile` | No | Groq model identifier |
| `EMBEDDING_MODEL` | string | `sentence-transformers/all-MiniLM-L6-v2` | No | HuggingFace model name for embeddings |
| `CHUNK_SIZE` | int | `500` | No | Text chunk size in characters |
| `CHUNK_OVERLAP` | int | `50` | No | Overlap between consecutive chunks in characters |
| `CONFIDENCE_THRESHOLD` | float | `0.6` | No | Minimum confidence to auto-respond (0.0-1.0) |
| `TOP_K_RESULTS` | int | `3` | No | Number of document chunks to retrieve per query |
| `CHROMA_PERSIST_DIR` | string | `./chroma_db` | No | Directory for ChromaDB data storage |
| `CHROMA_COLLECTION_NAME` | string | `flowmind_docs` | No | ChromaDB collection name |
| `DEMO_MODE` | bool | `True` | No | Load sample PDFs from demo_data/ on startup |
| `CORS_ORIGINS` | JSON array | `["*"]` | No | Allowed CORS origins |
| `LOG_LEVEL` | string | `INFO` | No | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `GOOGLE_SHEETS_ID` | string | `null` | No | Google Spreadsheet ID for conversation logging |
| `GOOGLE_CREDS_JSON` | JSON string | `null` | No | Google service account credentials (entire JSON) |
| `TELEGRAM_BOT_TOKEN` | string | `null` | No | Telegram bot token for escalation alerts |
| `TELEGRAM_ADMIN_CHAT_ID` | string | `null` | No | Telegram chat ID to receive alerts |

### Frontend (React / Vercel)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `VITE_API_URL` | string | `http://localhost:8000` | No | Backend API base URL |

### n8n (Railway)

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `N8N_BASIC_AUTH_ACTIVE` | string | `true` | Yes | Enable basic auth for n8n UI |
| `N8N_BASIC_AUTH_USER` | string | `admin` | Yes | n8n login username |
| `N8N_BASIC_AUTH_PASSWORD` | string | — | Yes | n8n login password |
| `WEBHOOK_URL` | string | — | Yes | Public URL of this n8n instance |
| `FASTAPI_URL` | string | — | Yes | Backend API URL for RAG queries |
| `TWILIO_ACCOUNT_SID` | string | — | Yes* | Twilio account SID (*for WhatsApp) |
| `TWILIO_AUTH_TOKEN` | string | — | Yes* | Twilio auth token (*for WhatsApp) |
| `TWILIO_PHONE_NUMBER` | string | — | Yes* | Your Twilio WhatsApp number (*for WhatsApp) |
| `TELEGRAM_BOT_TOKEN` | string | — | No | Telegram bot token (for n8n alert nodes) |
| `TELEGRAM_ADMIN_CHAT_ID` | string | — | No | Telegram chat ID for alerts |
| `GOOGLE_SHEETS_ID` | string | — | No | Google Sheets ID (for n8n logging nodes) |

### Cloudflare Worker

| Variable | Type | Set Via | Required | Description |
|----------|------|---------|----------|-------------|
| `N8N_WEBHOOK_URL` | string | `wrangler.toml` | **Yes** | n8n webhook URL to forward requests to |
| `TWILIO_AUTH_TOKEN` | string | `wrangler secret put` | **Yes** | Twilio auth token for signature verification |
| `RATE_LIMIT_KV` | KV namespace | `wrangler.toml` | **Yes** | KV namespace binding for rate limit counters |

---

## Deployment Checklist

Use this checklist to ensure all components are properly configured and connected:

- [ ] HuggingFace Spaces backend is running and `/api/health` returns `"status": "ok"`
- [ ] HuggingFace Spaces `GROQ_API_KEY` is set and health shows `groq: true`
- [ ] Railway n8n is running and accessible at its public URL
- [ ] Railway `FASTAPI_URL` points to the HuggingFace Spaces backend URL
- [ ] All 4 n8n workflows are imported and activated
- [ ] Railway Twilio credentials are configured
- [ ] Vercel frontend is deployed and loads in the browser
- [ ] Vercel `VITE_API_URL` points to the HuggingFace Spaces backend URL
- [ ] Cloudflare Worker is deployed and accessible
- [ ] Cloudflare Worker `N8N_WEBHOOK_URL` points to the Railway n8n webhook
- [ ] Cloudflare Worker `TWILIO_AUTH_TOKEN` is set as a secret
- [ ] Cloudflare KV namespace is created and bound
- [ ] Twilio webhook URL points to the Cloudflare Worker
- [ ] End-to-end test: send a WhatsApp message and receive an AI response
- [ ] Escalation test: send a question the AI can't answer and verify Telegram alert
