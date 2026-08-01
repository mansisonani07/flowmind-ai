# Architecture

Deep technical architecture document for FlowMind AI. This document explains the system design, component interactions, data flow, database schema, scaling strategy, and security model in detail. For a quick visual overview, refer to the architecture diagram in the main [README.md](../README.md).

---

## Overview

FlowMind AI is a distributed system composed of four independently deployable services that communicate over HTTP. The system follows a pipeline architecture where an incoming WhatsApp message passes through multiple stages \u2014 edge verification, workflow orchestration, retrieval-augmented generation, and response delivery \u2014 before reaching the customer. Each service is stateless or uses lightweight persistence (ChromaDB on disk, Google Sheets as a log store), making the system resilient and easy to scale horizontally.

The four services are:

1. **Cloudflare Worker** \u2014 Edge proxy that validates Twilio signatures and enforces per-phone rate limits before forwarding requests to n8n. This is the public-facing entry point for all WhatsApp webhook traffic, running at over 300 edge locations worldwide for minimal latency.

2. **n8n** \u2014 Visual workflow automation engine that orchestrates the WhatsApp query pipeline, document ingestion, scheduled reports, and escalation routing. n8n acts as the central nervous system of the application, connecting Twilio, the FastAPI backend, Telegram, and Google Sheets into cohesive automated workflows that non-technical users can inspect and modify visually.

3. **FastAPI Backend** \u2014 Python service that handles PDF ingestion, text chunking, embedding generation, vector storage in ChromaDB, RAG query processing via Groq LLM, and optional integrations with Google Sheets and Telegram. This is the computational core of the system, where all document understanding and AI inference happens.

4. **React Frontend** \u2014 Single-page application dashboard for uploading documents, viewing conversations, monitoring analytics, and configuring settings. The frontend communicates exclusively with the FastAPI backend via REST API calls and does not directly interact with n8n, Twilio, or any other service.

Each service can be developed, tested, deployed, and scaled independently. The only shared dependency is the FastAPI backend API contract (OpenAPI specification), which serves as the interface between the frontend, n8n, and the RAG engine.

---

## Design Decisions

### ChromaDB for Vector Storage

ChromaDB was chosen because it runs as an embedded database with no separate server process required. For a small-business tool that needs to work on free-tier hosting (HuggingFace Spaces with Docker SDK), this is critical \u2014 there is no persistent disk on many free platforms, and running a separate database like PostgreSQL with pgvector would require a paid tier or a separate hosting account. ChromaDB stores its data in a local directory (`./chroma_db`) that can be volume-mounted in Docker for persistence across container restarts.

For production scaling beyond the free tier, ChromaDB can be replaced with Pinecone, Weaviate, or Qdrant with minimal code changes since the `ChromaClient` class abstracts all vector operations behind a clean interface with `add_documents()` and `query()` methods. The collection uses cosine similarity as the default distance metric, which is well-suited for sentence-transformer embeddings.

ChromaDB also provides built-in support for metadata filtering, which allows the system to filter results by filename, chunk index, or upload date without additional infrastructure. The default embedding dimension is 384 (from `all-MiniLM-L6-v2`), and ChromaDB handles this natively without any configuration.

### Groq for LLM Inference

Groq provides LPU (Language Processing Unit) based inference that delivers sub-200ms response times for Llama 3.3 70B, which is orders of magnitude faster than traditional GPU-based inference. Compared to OpenAI GPT-4o, Groq free tier offers significantly more requests per minute (30 RPM vs. OpenAI restrictive free tier), and the speed is essential for a real-time WhatsApp chatbot where customers expect near-instant replies.

The `GroqClient` service in FlowMind includes automatic retry logic with exponential backoff (starting at 1 second, doubling up to 3 retries) and rate-limit-aware sleep to handle Groq 429 responses gracefully. The client uses the official `groq` Python SDK (version 0.11.0) which provides typed responses and proper error handling.

The default model is `llama-3.3-70b-versatile`, which provides an excellent balance of instruction-following capability, reasoning ability, and speed. This can be changed via the `GROQ_MODEL` environment variable without any code changes. The system prompt instructs the model to answer based only on the provided context and to explicitly state when it cannot answer from the given documents.

### n8n for Workflow Orchestration

n8n enables non-technical business owners to visually inspect, modify, and extend the automation pipeline without writing code. The WhatsApp query handling workflow, document ingestion flow, daily summaries, and weekly reports are all defined as JSON files that can be imported into any n8n instance. This makes the system adaptable \u2014 a restaurant owner can add a \"take order\" node, a clinic can add an \"appointment booking\" node, all without touching the backend code.

n8n webhook trigger capability is central to the architecture. Twilio sends HTTP POST requests to the Cloudflare Worker, which forwards them to an n8n webhook endpoint. The workflow then uses HTTP Request nodes to call the FastAPI backend and Twilio API. This decoupling means the same n8n workflow can be reconfigured to work with different backend URLs, different Twilio credentials, or different alert channels without any backend changes.

The four pre-built workflows cover the complete lifecycle: real-time message handling (01), document management (02), daily operational reporting (03), and weekly business analytics (04). Each workflow can be activated, paused, or modified independently through the n8n visual editor.

### Cloudflare Workers for Edge Proxy

The Cloudflare Worker serves two critical purposes: (1) it verifies Twilio HMAC-SHA1 webhook signature at the edge, rejecting spoofed requests before they ever reach n8n or the backend, and (2) it enforces per-phone rate limiting using Cloudflare KV storage, preventing any single user from flooding the system with requests. Running this at the edge means that malicious traffic is stopped close to the source \u2014 often within 50ms of the nearest Cloudflare point of presence \u2014 reducing load on downstream services dramatically.

The Worker is implemented in TypeScript (approximately 140 lines) and uses the Web Crypto API for HMAC-SHA1 signature computation, which is available natively in the Workers runtime without any external dependencies. Rate limiting uses a minute-based sliding window stored in Cloudflare KV with a 2-minute TTL for automatic cleanup. The Worker also handles CORS preflight (OPTIONS) requests for the frontend, though the primary use case is proxying Twilio webhook traffic.

The forward pass preserves the original request Content-Type header (typically `application/x-www-form-urlencoded` from Twilio) and passes the raw body through unchanged, ensuring n8n receives the exact payload format it expects. The Worker adds an `X-RateLimit-Remaining` response header for observability.

### FastAPI for the Backend

FastAPI was chosen for its native async support using Python asyncio, which is critical when making concurrent LLM API calls to Groq and Google Sheets writes without blocking the event loop. FastAPI automatically generates interactive OpenAPI (Swagger) and ReDoc documentation at `/docs` and `/redoc` endpoints, which serves as both developer documentation and a live API testing tool.

Pydantic v2 validation ensures that all request and response payloads conform to strict schemas defined in `app/models/schemas.py`. Invalid requests are rejected with clear 422 error messages before they reach any business logic. This eliminates an entire class of input-validation bugs.

The `lifespan` context manager pattern (introduced in FastAPI 0.109) allows clean initialization of the RAG engine and embedding model at startup, and proper cleanup on shutdown. This is important because the sentence-transformers model takes 2-3 seconds to load into memory, and this needs to happen once at startup, not on every request. The model is then reused across all requests as a singleton.

FastAPI performance (comparable to Go frameworks like Gin and Fiber, as measured by independent benchmarks) means the backend can handle hundreds of concurrent RAG queries on modest hardware. The combination of async I/O, connection pooling, and efficient serialization makes it well-suited for the bursty traffic pattern typical of a WhatsApp chatbot.

### React 19 for the Frontend

React 19 provides the latest features including improved concurrent rendering with automatic batching, which ensures smooth UI updates even when multiple API responses arrive simultaneously. The frontend uses Tailwind CSS v4 (with the new `@import \"tailwindcss\"` syntax and CSS-first configuration), Framer Motion for page transition animations and micro-interactions, Recharts for the analytics charts (line charts, bar charts, area charts), and TanStack Query v5 for server state management with automatic background refetching every 30 seconds.

The dashboard is organized as five pages (Home, Documents, Conversations, Analytics, Settings) connected by React Router v7. A persistent sidebar provides navigation, and a responsive layout collapses to a mobile drawer on screens smaller than 768px. The dark mode implementation uses a React Context (`ThemeContext`) that respects the user system preference (`prefers-color-scheme`) and allows manual override via a toggle button.

Component architecture follows a clear separation: `pages/` contains route-level components, `components/` contains reusable UI and domain components, `hooks/` contains custom hooks for data fetching and state management, and `lib/` contains the Axios API client and utility functions. TypeScript strict mode is enabled to catch type errors at compile time.

---

## Data Flow

### WhatsApp Query Flow (Primary Path)

Here is the complete, detailed flow when a customer sends a WhatsApp message to the business number:

1. **Customer sends a WhatsApp message** to the business Twilio number. The message contains the customer phone number and the text body (e.g., \"What are your opening hours?\").

2. **Twilio receives the message** and sends an HTTP POST to the configured webhook URL (the Cloudflare Worker URL). The POST body is `application/x-www-form-urlencoded` and includes fields like `From`, `Body`, `To`, `MessageSid`, `NumMedia`, and `ProfileName`. Twilio also attaches an `X-Twilio-Signature` header containing the HMAC-SHA1 signature of the request.

3. **Cloudflare Worker validates the Twilio signature** by recomputing the HMAC-SHA1 hash of the URL (without query params) + sorted query params + raw body using the `TWILIO_AUTH_TOKEN` as the key. If the computed signature does not match the `X-Twilio-Signature` header, the Worker returns a 403 JSON error. This prevents attackers from sending fake WhatsApp messages to the system.

4. **Cloudflare Worker checks rate limits** by extracting the sender phone number from the `From` field, computing a per-minute key (`rate:{phone}:{current_minute}`), and looking it up in Cloudflare KV. If the count is 20 or more, the Worker returns a 429 error. Otherwise, it increments the counter (with a 120-second TTL) and forwards the request to n8n.

5. **n8n receives the webhook trigger** via the WhatsApp Query Handler workflow (01-whatsapp-query-handler.json). The workflow activates:
   - **Extract Fields**: Parses the Twilio payload to extract `Body` (message text) and `From` (sender phone number, formatted as `whatsapp:+1234567890`).
   - **HTTP Request to FastAPI**: Sends a POST request to the FastAPI `/api/query` endpoint with the JSON body `{"question": "...", "user_phone": "+1234567890"}`.

6. **FastAPI Backend processes the `/api/query` request**:
   - **Embedding Generation**: The `RAGEngine` generates a 384-dimensional embedding for the question using the `Embedder` service, which wraps `sentence-transformers/all-MiniLM-L6-v2`.
   - **Vector Search**: Queries ChromaDB `flowmind_docs` collection for the top-k (default 3) most similar document chunks using cosine similarity against the question embedding.
   - **Confidence Calculation**: Computes confidence as `1.0 - min(distances)` where distances are the cosine distances of the retrieved chunks. The result is clamped to [0.0, 1.0].
   - **Escalation Check**: If average confidence is below the threshold (default 0.6), the system marks the query as escalated and returns a pre-defined escalation message without calling the LLM.
   - **LLM Generation**: If confidence is sufficient, the `GroqClient` constructs a prompt with the retrieved context chunks and the question, then sends it to Groq `llama-3.3-70b-versatile` model. The system prompt instructs the model to answer based only on the provided context.
   - **Response Construction**: Returns a JSON object containing the answer text, source citations (filename, page, truncated text), confidence score, escalation flag, number of chunks used, and response time in milliseconds.
   - **Fire-and-forget Logging**: Asynchronously logs the conversation to Google Sheets (if configured) and sends a Telegram alert if the query was escalated.

7. **n8n processes the FastAPI response**:
   - If `escalated` is `false`: Sends the answer back to the customer via the Twilio WhatsApp API (HTTP POST to `https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json`).
   - If `escalated` is `true`: Sends a human-escalation message to the customer and an alert to the admin via the Telegram Bot API with the customer question and phone number.
   - Returns HTTP 200 to Twilio to confirm receipt (preventing retries).

8. **Customer receives the WhatsApp reply** on their phone, typically within 1-3 seconds of sending their original message.

### Document Upload Flow

1. User uploads a PDF through the React dashboard (drag-and-drop or file picker) or via the `/api/upload` API endpoint.
2. FastAPI receives the file, validates it is a PDF under 10 MB, and passes the bytes to `RAGEngine.ingest_document()`.
3. `DocumentProcessor.extract_text_from_pdf()` uses PyPDF2 to extract text from each page.
4. `DocumentProcessor.chunk_text()` splits the text into overlapping chunks (500 chars, 50 overlap).
5. `Embedder.embed_batch()` generates 384-dim embeddings for all chunks in a single batch call.
6. `ChromaClient.add_documents()` stores the chunks with their embeddings and metadata (filename, chunk_index, uploaded_at) into the `flowmind_docs` collection.
7. If the upload was triggered via n8n workflow (02), a Telegram confirmation is sent with the filename and chunk count.

### Scheduled Report Flows

- **Daily Summary** (03-daily-summary.json): n8n cron triggers at 21:00 UTC. Fetches stats from `/api/stats`, formats a summary, and sends to Telegram.
- **Weekly Analytics** (04-weekly-analytics.json): n8n cron triggers Mondays at 09:00 UTC. Fetches weekly analytics, formats a detailed report, and sends to Telegram.

---

## Component Diagram

```
+---------------------------------------------------------------------------+

                           EXTERNAL SERVICES

  +--------------+  +--------------+  +--------------+  +--------------+  +--------------+
  |   WhatsApp   |  |   Twilio     |  |   Telegram   |  | Google Sheets|  |    Groq      |
  |   Customer   |  |   API        |  |   Bot API    |  |   API        |  |   LLM API    |
  +------+-------+  +------+-------+  +--------------+  +--------------+  +------+-------+
         |                  |                                                       |
         |  WhatsApp msg    |  HTTP POST                                            |  Inference
         |----------------->|  (webhook)                                            |  request
         |                  |                                                       |
         |                  v                                                       |
         |         +------------------+                                            |
         |         |  Cloudflare      |                                            |
         |         |  Worker          |                                            |
         |         |  +------------+  |                                            |
         |         |  | Twilio     |  |                                            |
         |         |  | Signature  |  |                                            |
         |         |  | Verify     |  |                                            |
         |         |  +-----+------+  |                                            |
         |         |  +-----+------+  |                                            |
         |         |  | Rate Limit |  |                                            |
         |         |  | (KV Store) |  |                                            |
         |         |  +-----+------+  |                                            |
         |         +-------+----------+                                            |
         |                 | HTTP POST                                             |
         |                 v                                                       |
         |         +------------------+     +--------------------------------------+       |
         |         |      n8n         |     |       FastAPI Backend                |       |
         |         |  +------------+  |     |  +--------------------------------+  |       |
         |         |  | Webhook    |  |     |  |     RAGEngine                  |  |       |
         |         |  | Trigger    |  |     |  |  +--------------------------+  |  |       |
         |         |  +-----+------+  |     |  |  | Embedder                 |  |  |       |
         |         |        |         |     |  |  | (MiniLM-L6-v2)           |  |  |       |
         |         |  +-----+------+  |     |  |  +------------+-------------+  |  |       |
         |         |  | HTTP Req   |  |     |  |  +------------+-------------+  |  |       |
         |         |  | to FastAPI |--+-----+->|  | ChromaClient            |  |  |       |
         |         |  +-----+------+  |     |  |  | (ChromaDB)              |  |  |       |
         |         |        |         |     |  |  +--------------------------+  |  |       |
         |         |  +-----+------+  |     |  |  +--------------------------+  |  |       |
         |         |  | Twilio     |  |     |  |  | GroqClient               |  |  |       |
         |         |  | Send Reply |  |     |  |  | (Llama 3.3 70B)         |  |  |       |
         |         |  +------------+  |     |  |  +--------------------------+  |  |       |
         |         |  +------------+  |     |  |  +--------------------------+  |  |       |
         |         |  | Telegram    |  |     |  |  | TelegramNotifier         |  |  |       |
         |         |  | Alert      |  |     |  |  +--------------------------+  |  |       |
         |         |  +------------+  |     |  |  +--------------------------+  |  |       |
         |         |  +------------+  |     |  |  | SheetsLogger            |  |  |       |
         |         |  | Sheets Log |  |     |  |  +--------------------------+  |  |       |
         |         |  +------------+  |     |  +--------------------------------------+  |       |
         |         +------------------+     +--------------------------------------+  |       |
         |                                                                       |
         |  WhatsApp reply                                                       |
         |<----------------------------------------------------------------------+
         |

  +----------------------------------------------------------------------+
  |                    React Frontend (Vercel)                           |
  |  +----------+  +-----------+  +----------+  +----------+  +--------+  |
  |  |  Home    |  | Documents |  |  Convos  |  |Analytics |  |Settings|  |
  |  |Dashboard |  |  Manager  |  |  Viewer  |  | Charts   |  | Config |  |
  |  +----------+  +-----------+  +----------+  +----------+  +--------+  |
  +----------------------------------+-----------------------------------+
                                   | REST API calls
                                   v
                          FastAPI Backend /api/*

+---------------------------------------------------------------------------+
```

---

## Database Schema

### ChromaDB: `flowmind_docs` Collection

ChromaDB stores document chunks as embedded vectors with associated metadata. There is no traditional relational schema \u2014 each chunk is a record with the following metadata fields:

| Field | Type | Description | Example |
|-------|------|-------------|--------|
| `id` | string | Auto-generated unique chunk ID combining filename and index | `restaurant_menu.pdf__chunk_12` |
| `filename` | string | Original PDF filename | `restaurant_menu.pdf` |
| `chunk_index` | integer | Order of this chunk within the document (0-based) | `12` |
| `uploaded_at` | string | ISO 8601 timestamp of when the document was uploaded | `2024-12-15T14:30:00Z` |
| `text` | string | The actual text content of the chunk (500 chars, 50 overlap) | `Grilled Salmon - Fresh Atlantic salmon...` |
| `embedding` | float[384] | 384-dimensional vector from `all-MiniLM-L6-v2` | `[0.0231, -0.0145, 0.0872, ...]` |

**Query mechanism**: Queries are performed using cosine similarity (L2 distance in ChromaDB) against the `embedding` field. The query converts the user question to a 384-dim vector using the same `all-MiniLM-L6-v2` model, then retrieves the top-k most similar chunks. Optional metadata filtering by `filename` is supported via ChromaDB `where` clause.

**Storage format**: ChromaDB stores data in a local directory (`./chroma_db/`) using SQLite for metadata and a custom format for vector indices. In Docker, this directory is volume-mounted for persistence. On HuggingFace Spaces, the data persists for the lifetime of the Space (but resets on redeployment unless a persistent volume is attached).

**Index size estimation**: Each chunk takes approximately 1.5 KB of metadata + 1.5 KB for the 384-dim float32 vector = ~3 KB total. A 10-page PDF generates roughly 40-50 chunks = ~150 KB. A typical small business with 5 documents of 10 pages each would use ~750 KB of vector storage.

### Google Sheets: Conversation Log (Optional)

When Google Sheets integration is enabled, every conversation is logged as a new row in a spreadsheet with the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `Timestamp` | string | ISO 8601 UTC timestamp of the query |
| `User Phone` | string | Customer phone number |
| `Question` | string | The customer WhatsApp message |
| `Answer` | string | The AI response (or escalation message) |
| `Confidence` | float | Confidence score (0.0-1.0) |
| `Escalated` | boolean | Whether the query was escalated to a human |
| `Sources` | string | JSON array of source filenames |
| `Response Time (ms)` | float | Total response time in milliseconds |

This log is append-only and is used for the daily summary and weekly analytics reports. The SheetsLogger uses `gspread` with a Google service account for authentication.

---

## Scaling Considerations

### Current Capacity

The system as designed handles up to ~100 concurrent users comfortably on free-tier infrastructure. The primary bottlenecks are: (1) the embedding model batch processing capacity on CPU-only HuggingFace Spaces (approximately 50 embeddings/second for the MiniLM model), and (2) Groq free-tier rate limit of 30 requests/minute.

### Vertical Scaling

For small to medium businesses (up to ~100 concurrent users), vertical scaling is sufficient:
- **HuggingFace Spaces**: Upgrade from the free basic CPU tier (2 vCPU, 16GB RAM) to a paid tier with more RAM for faster embedding batch processing. The embedding model uses approximately 400MB of RAM, and ChromaDB memory usage scales linearly with the number of stored vectors.
- **Railway**: Use higher-tier plans for n8n to handle more concurrent workflow executions. The free tier (512MB RAM, 500 hours/month) is sufficient for moderate traffic but will throttle under sustained load.
- **Groq**: Upgrade from the free tier to a paid plan for higher rate limits (up to thousands of requests per minute).

### Horizontal Scaling

For larger deployments (100+ concurrent users or multiple businesses):
- **Load Balancer**: Place Cloudflare Load Balancing, Nginx, or AWS ALB in front of multiple FastAPI backend instances. The backend is stateless (except for the in-memory embedding model, which each instance loads independently).
- **Managed Vector Database**: Replace the embedded ChromaDB with a managed vector database service (Pinecone, Weaviate Cloud, or Qdrant Cloud) so all backend instances share the same vector store. This requires only changing the `ChromaClient` implementation while keeping the same interface.
- **Distributed Rate Limiting**: Replace the in-memory `RateLimiter` (FastAPI middleware) and Cloudflare KV (edge) with Redis for consistent distributed rate limiting across multiple backend instances. Redis supports atomic increment operations and TTL-based key expiration natively.
- **Message Queue**: For very high throughput, add a message queue (Redis Streams, RabbitMQ, or SQS) between n8n and the FastAPI backend to handle burst traffic without overwhelming the backend.

### Caching Strategies

- **TTLCache (built-in)**: The backend includes a thread-safe TTL cache with LRU eviction for repeated queries. Default TTL is 5 minutes. Identical questions within the cache window return cached results instantly, reducing LLM API calls and Groq costs. The cache key is the exact question text (case-sensitive).
- **Query result caching**: In production, consider a Redis-backed cache with longer TTLs for frequently asked questions (e.g., opening hours, pricing). This can reduce LLM calls by 50-80% for businesses with repetitive query patterns.
- **Embedding model caching**: The `Embedder` is a singleton that keeps the `sentence-transformers` model in memory, avoiding the 2-3 second model loading time on every request. In a multi-worker deployment (e.g., Gunicorn with 4 workers), each worker loads its own model instance.
- **CDN caching**: The React frontend on Vercel is automatically served from a global CDN with aggressive caching headers. Static assets (JS, CSS, images) are cache-busted via content hashing by Vite.

### Performance Benchmarks

| Operation | Typical Latency | Notes |
|-----------|----------------|-------|
| Embedding generation (single) | 15-30ms | CPU, all-MiniLM-L6-v2 |
| Embedding generation (batch of 10) | 50-80ms | Batched for efficiency |
| ChromaDB query (top-3) | 5-15ms | In-memory, cosine similarity |
| Groq LLM inference | 150-400ms | Sub-200ms typical for short answers |
| Full RAG query (end-to-end) | 200-500ms | Including embedding + search + LLM |
| PDF upload + ingestion (10 pages) | 3-5 seconds | Including extraction + chunking + embedding |

---

## Security Architecture

FlowMind AI implements defense-in-depth security across multiple layers. Each layer independently mitigates a specific class of threats, and no single layer is relied upon exclusively.

| Layer | Mechanism | Details |
|-------|-----------|----------|
| **Edge \u2014 Twilio Signature Verification** | HMAC-SHA1 | The Cloudflare Worker validates every incoming webhook request against your `TWILIO_AUTH_TOKEN`. The validation recomputes the HMAC-SHA1 signature of the URL + sorted params + body and compares it to the `X-Twilio-Signature` header. Invalid signatures are rejected with HTTP 403 before the request reaches any downstream service. This prevents attackers from sending forged WhatsApp messages to the system. |
| **Edge \u2014 Per-Phone Rate Limiting** | Cloudflare KV | Cloudflare KV enforces 20 requests/minute per phone number. Rate limit counters are stored with a 120-second TTL for automatic cleanup. This prevents any single user from flooding the system with requests, which could cause denial of service or run up Groq API costs. |
| **API \u2014 Sliding-Window Rate Limiter** | In-memory | FastAPI middleware enforces 20 requests/minute per client IP (or `X-User-Phone` header if present). Returns `429 Too Many Requests` with `Retry-After` and `X-RateLimit-Remaining` headers. Uses a sliding window algorithm that is more accurate than fixed-window approaches. |
| **API \u2014 CORS Configuration** | FastAPI middleware | Configurable via the `CORS_ORIGINS` environment variable (JSON array). The default is `["*"]` for development convenience. In production, this should be restricted to specific origins like `https://flowmind-ai.vercel.app` and the n8n domain to prevent unauthorized cross-origin API access from malicious websites. |
| **API \u2014 File Validation** | Upload endpoint | The upload endpoint only accepts files with the `.pdf` extension and enforces a 10 MB size limit. The file contents are fully read into memory and validated by PyPDF2 before processing. Non-PDF files or files that fail text extraction are rejected with a 400 error. This prevents malformed files from causing crashes in the PDF parser. |
| **Data \u2014 No Sensitive Data in Logs** | Logger configuration | API keys, tokens, and credentials are never included in log output. Phone numbers do appear in conversation logs but can be redacted via logger configuration if GDPR or privacy regulations require it. The structured logger uses Python `logging` module with configurable log levels. |
| **Secrets \u2014 Environment Variables** | Platform secret managers | All API keys, tokens, and credentials are loaded from environment variables and are never hardcoded in source code. Locally, they are stored in `.env` files (which are git-ignored). In production, each platform secret manager is used: HuggingFace Spaces Variables, Railway Environment Variables, Vercel Environment Variables, and Cloudflare Wrangler Secrets (`wrangler secret put`). This prevents credential leakage through source code repositories. |
| **Transport \u2014 HTTPS Everywhere** | TLS 1.2+ | All external communications use HTTPS. Twilio webhooks require HTTPS. Groq API is HTTPS-only. Telegram Bot API uses HTTPS. Google Sheets API uses HTTPS. The Cloudflare Worker and HuggingFace Spaces both enforce TLS automatically. No sensitive data is ever transmitted over plain HTTP. |
| **Input \u2014 Pydantic Validation** | Pydantic v2 | All API request bodies are validated against strict Pydantic v2 schemas before processing. Invalid payloads are rejected with descriptive 422 error messages. This prevents injection attacks, malformed data, and unexpected field types from reaching business logic. |
| **LLM \u2014 Prompt Engineering** | System prompt | The LLM system prompt instructs the model to answer based only on the provided document context and to not make up information. This reduces the risk of hallucination and ensures responses are grounded in the business actual documents. |
