# API Reference

Complete REST API reference for the FlowMind AI backend. All endpoints are prefixed with `/api`.

**Base URL**: `http://localhost:8000` (local development) or your deployed URL (production).

---

## Authentication

FlowMind AI is designed for self-hosted use and does **not** require authentication by default. The backend trusts requests from internal services (n8n, the dashboard frontend, etc.) based on network-level isolation.

For production deployments, you can add authentication by:

- Placing the service behind an authenticating reverse proxy (Cloudflare Access, Authelia, Nginx basic auth)
- Adding FastAPI middleware that validates an `Authorization: Bearer <token>` header
- Using API key-based middleware with a shared secret between n8n and the backend

No authentication headers are required for any of the endpoints documented below.

---

## Rate Limits

All endpoints are subject to rate limiting to prevent abuse and ensure fair usage.

| Property | Value |
|----------|-------|
| **Global limit** | 20 requests per minute |
| **Limit key** | Client IP address (or `X-User-Phone` header if present) |
| **Response header** | `X-RateLimit-Remaining` — remaining requests in the current window |
| **Throttle response** | HTTP 429 with retry-after guidance |

When the rate limit is exceeded, the API returns:

```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

The `/query` endpoint has an additional in-route check at 20 req/min per `user_phone` to prevent a single WhatsApp user from flooding the system.

---

## Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "detail": "Human-readable description of what went wrong"
}
```

### Standard Error Status Codes

| Status Code | HTTP Meaning | When It Occurs |
|-------------|-------------|----------------|
| `400` | Bad Request | Invalid input, empty file, wrong file format, malformed JSON body |
| `404` | Not Found | Requested document does not exist in the index |
| `413` | Payload Too Large | Uploaded file exceeds the 10 MB size limit |
| `422` | Unprocessable Entity | Missing required fields in request body (e.g., no `question` field) |
| `429` | Too Many Requests | Rate limit exceeded (20 req/min) |
| `500` | Internal Server Error | Unexpected failure (RAG pipeline error, ChromaDB failure, Groq API error) |

---

## Endpoints

---

### 1. GET /api/health

Returns the current system health status including service connectivity checks and application uptime.

- **Method**: `GET`
- **Path**: `/api/health`
- **Description**: Verifies that the backend is running and that critical service connections (ChromaDB, Groq API, Google Sheets, Telegram) are healthy. Use this endpoint for load balancer health checks or monitoring alerts.

#### Request Body

None.

#### Response Body (200 OK)

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
  "uptime_seconds": 342.57
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall system status: `"ok"` or `"error"` |
| `version` | string | Application version from the `VERSION` environment variable |
| `services.chromadb` | boolean | `true` if ChromaDB connection is healthy and responsive |
| `services.groq` | boolean | `true` if a valid Groq API key is configured and the API is reachable |
| `services.sheets` | boolean | `true` if Google Sheets service account credentials are configured and valid |
| `services.telegram` | boolean | `true` if Telegram bot token is configured |
| `uptime_seconds` | float | Number of seconds since the application started |

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | System is healthy (individual services may be unavailable — check the `services` object) |
| 500 | Critical failure (backend itself is broken) |

#### cURL Example

```bash
curl http://localhost:8000/api/health
```

---

### 2. POST /api/query

Submit a user question to the RAG pipeline. The system searches indexed documents in ChromaDB, generates an answer using the Groq LLM, and returns the result with source citations and a confidence score. If confidence is below the threshold, the response is flagged for escalation.

- **Method**: `POST`
- **Path**: `/api/query`
- **Description**: The core endpoint of FlowMind AI. Accepts a natural language question and a user phone number, processes it through the retrieval-augmented generation pipeline, and returns a structured response with answer, sources, and confidence.

#### Request Body

```json
{
  "question": "What are your business hours?",
  "user_phone": "+1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | string | **Yes** | The user's natural language question. Must not be empty after trimming whitespace. |
| `user_phone` | string | **Yes** | Phone number of the user. Used for per-user rate limiting (20 req/min) and conversation logging. Format: E.164 international (e.g., `+1234567890`). |

#### Response Body (200 OK)

```json
{
  "answer": "We are open Monday to Friday, 9 AM to 6 PM, and Saturday 10 AM to 4 PM. We are closed on Sundays.",
  "sources": [
    {
      "filename": "restaurant_info.pdf",
      "page": 1,
      "text": "Business Hours: Mon-Fri 9AM-6PM, Sat 10AM-4PM, Sun Closed"
    },
    {
      "filename": "faq.pdf",
      "page": 2,
      "text": "Our operating hours are Monday through Friday 9 to 6."
    }
  ],
  "confidence": 0.92,
  "escalated": false,
  "chunks_used": 2,
  "response_time_ms": 245.3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `answer` | string | The AI-generated answer based on retrieved document context |
| `sources` | array | List of document chunks used as context for generating the answer |
| `sources[].filename` | string | Name of the source document the chunk was extracted from |
| `sources[].page` | integer | Page number in the source document (if available from PDF metadata) |
| `sources[].text` | string | The actual text content of the retrieved chunk |
| `confidence` | float | Confidence score from 0.0 to 1.0. Based on cosine similarity of retrieved chunks. |
| `escalated` | boolean | `true` if confidence is below `CONFIDENCE_THRESHOLD` (default 0.5), meaning a human should handle this query |
| `chunks_used` | integer | Number of document chunks retrieved from ChromaDB and used as context |
| `response_time_ms` | float | Total processing time in milliseconds (embedding + retrieval + LLM inference) |

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Query processed successfully. Check `escalated` to determine if human follow-up is needed. |
| 422 | Missing or invalid `question` field, or `user_phone` is empty |
| 429 | Rate limit exceeded for this user (20 req/min) |
| 500 | RAG pipeline failure (ChromaDB query error, Groq API timeout, or embedding failure) |

#### cURL Examples

```bash
# Basic query
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are your timings?", "user_phone": "+1234567890"}'

# Pretty-printed response
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Do you have vegan options?", "user_phone": "+0987654321"}' \
  | python -m json.tool

# Low-confidence query (triggers escalation)
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the meaning of life?", "user_phone": "+1111111111"}'
```

---

### 3. POST /api/upload

Upload a PDF document to be indexed into the RAG system. The file is parsed, split into chunks (500 characters with 50-character overlap by default), embedded using the configured embedding model, and stored in ChromaDB for future retrieval.

- **Method**: `POST`
- **Path**: `/api/upload`
- **Description**: Uploads a PDF document, processes it through the document ingestion pipeline (PDF parsing, text extraction, chunking, embedding, ChromaDB storage), and returns the number of chunks created.

#### Request Body

This endpoint uses `multipart/form-data` encoding. The request body is **not** JSON.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | binary file | **Yes** | The PDF file to upload. Maximum size: 10 MB. Only `.pdf` files are accepted. |

#### Response Body (200 OK)

```json
{
  "status": "success",
  "filename": "restaurant_menu.pdf",
  "chunks_created": 23,
  "message": "Document 'restaurant_menu.pdf' processed and indexed successfully."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"success"` on successful indexing, `"error"` on failure |
| `filename` | string | The name of the uploaded file as provided in the request |
| `chunks_created` | integer | Number of text chunks extracted, embedded, and stored in ChromaDB |
| `message` | string | Human-readable confirmation or error message |

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Document uploaded and indexed successfully |
| 400 | Invalid file type (not `.pdf`) or empty file |
| 413 | File exceeds the 10 MB size limit |
| 500 | PDF parsing error, embedding failure, or ChromaDB write error |

#### cURL Examples

```bash
# Upload a PDF file
curl -X POST http://localhost:8000/api/upload -F "file=@/path/to/menu.pdf"

# Upload with verbose output
curl -v -X POST http://localhost:8000/api/upload -F "file=@/path/to/document.pdf"

# Upload a file larger than 10 MB (will return 413)
curl -X POST http://localhost:8000/api/upload -F "file=@/path/to/huge.pdf"
```

---

### 4. GET /api/documents

List all documents that have been indexed into the RAG system, along with their chunk counts and upload timestamps.

- **Method**: `GET`
- **Path**: `/api/documents`
- **Description**: Returns metadata for every document currently stored in ChromaDB. Useful for the admin dashboard to display the document library and for verifying that uploads succeeded.

#### Request Body

None.

#### Response Body (200 OK)

```json
{
  "documents": [
    {
      "filename": "restaurant_menu.pdf",
      "chunk_count": 23,
      "uploaded_at": "2025-01-15T10:30:00Z"
    },
    {
      "filename": "faq.pdf",
      "chunk_count": 12,
      "uploaded_at": "2025-01-15T11:00:00Z"
    },
    {
      "filename": "pricing_guide.pdf",
      "chunk_count": 8,
      "uploaded_at": "2025-01-16T09:15:00Z"
    }
  ],
  "total": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| `documents` | array | List of indexed document metadata objects |
| `documents[].filename` | string | Name of the document |
| `documents[].chunk_count` | integer | Number of chunks stored in ChromaDB for this document |
| `documents[].uploaded_at` | string | ISO 8601 timestamp of when the document was uploaded |
| `total` | integer | Total number of documents in the index |

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | List returned successfully (may be an empty array if no documents are indexed) |
| 500 | ChromaDB query failure |

#### cURL Examples

```bash
# List all documents
curl http://localhost:8000/api/documents

# Pretty-print the document list
curl http://localhost:8000/api/documents | python -m json.tool

# Count total documents with jq
curl -s http://localhost:8000/api/documents | jq '.total'
```

---

### 5. GET /api/documents/{filename}

Get detailed metadata for a specific indexed document.

- **Method**: `GET`
- **Path**: `/api/documents/{filename}`
- **Description**: Returns the chunk count and upload timestamp for a single document identified by its filename. Used by the dashboard to show document details before deletion or for verification purposes.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | **Yes** | URL-encoded document filename (e.g., `restaurant_menu.pdf`) |

#### Request Body

None.

#### Response Body (200 OK)

```json
{
  "filename": "restaurant_menu.pdf",
  "chunk_count": 23,
  "uploaded_at": "2025-01-15T10:30:00Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `filename` | string | Name of the document |
| `chunk_count` | integer | Number of chunks stored for this document in ChromaDB |
| `uploaded_at` | string | ISO 8601 timestamp of when the document was uploaded |

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Document found and metadata returned |
| 500 | ChromaDB query error |

#### cURL Examples

```bash
# Get details for a specific document
curl "http://localhost:8000/api/documents/restaurant_menu.pdf"

# URL-encode filenames with spaces
curl "http://localhost:8000/api/documents/my%20document.pdf"

# Get chunk count for a document
curl -s "http://localhost:8000/api/documents/faq.pdf" | jq '.chunk_count'
```

---

### 6. DELETE /api/documents/{filename}

Delete a document and all of its associated chunks from the ChromaDB vector index. This is a permanent operation — the document data cannot be recovered after deletion.

- **Method**: `DELETE`
- **Path**: `/api/documents/{filename}`
- **Description**: Removes all chunks belonging to the specified document from ChromaDB. The physical PDF file (if stored on disk) is not deleted. After this operation, queries will no longer retrieve content from this document.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filename` | string | **Yes** | URL-encoded document filename to delete |

#### Request Body

None.

#### Response Body (200 OK)

```json
{
  "status": "deleted",
  "filename": "restaurant_menu.pdf",
  "chunks_removed": 23
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"deleted"` on success |
| `filename` | string | The document that was removed |
| `chunks_removed` | integer | Number of chunks deleted from ChromaDB |

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Document and all its chunks were deleted successfully |
| 500 | ChromaDB deletion error |

#### cURL Examples

```bash
# Delete a document
curl -X DELETE "http://localhost:8000/api/documents/old_menu.pdf"

# Verify deletion by listing documents
curl -X DELETE "http://localhost:8000/api/documents/old_menu.pdf" && \
  curl http://localhost:8000/api/documents

# Delete a document with spaces in the filename
curl -X DELETE "http://localhost:8000/api/documents/my%20old%20document.pdf"
```

---

### 7. GET /api/stats

Get combined system statistics from both ChromaDB (document and chunk counts) and conversation logs (query counts, average confidence, escalation rates, popular questions, and daily query volume).

- **Method**: `GET`
- **Path**: `/api/stats`
- **Description**: Aggregates statistics from the vector database and conversation logs. Used by the admin dashboard and by the n8n daily/weekly report workflows. The `days` query parameter controls how far back to look for conversation data.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `days` | integer | No | `7` | Number of days to include in conversation stats. Range: 1–365. Document/chunk counts always reflect the current state regardless of this parameter. |

#### Request Body

None.

#### Response Body (200 OK)

```json
{
  "total_documents": 3,
  "total_chunks": 47,
  "total_queries": 156,
  "avg_confidence": 0.87,
  "escalation_rate": 0.05,
  "popular_questions": [
    "What are your hours?",
    "Do you have vegan options?",
    "Where are you located?"
  ],
  "daily_query_count": [
    {"date": "2025-01-14", "count": 18},
    {"date": "2025-01-15", "count": 24},
    {"date": "2025-01-16", "count": 31}
  ],
  "avg_response_time": 312.5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total_documents` | integer | Total number of indexed documents in ChromaDB |
| `total_chunks` | integer | Total number of chunks across all documents |
| `total_queries` | integer | Number of queries processed in the specified time window |
| `avg_confidence` | float | Average confidence score across all queries in the time window (0.0–1.0) |
| `escalation_rate` | float | Proportion of queries that were escalated (0.0–1.0). E.g., 0.05 means 5% of queries were escalated. |
| `popular_questions` | array | Top 5 most frequently asked questions in the time window |
| `daily_query_count` | array | Daily query volume breakdown for each day in the time window |
| `daily_query_count[].date` | string | ISO 8601 date string (YYYY-MM-DD) |
| `daily_query_count[].count` | integer | Number of queries on that date |
| `avg_response_time` | float | Average response time in milliseconds across all queries in the time window |

#### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Statistics returned successfully |
| 500 | Error querying ChromaDB or conversation logs |

#### cURL Examples

```bash
# Last 7 days (default)
curl http://localhost:8000/api/stats

# Last 30 days
curl "http://localhost:8000/api/stats?days=30"

# Today only
curl "http://localhost:8000/api/stats?days=1"

# Full year
curl "http://localhost:8000/api/stats?days=365"

# Get just the total query count
curl -s "http://localhost:8000/api/stats?days=7" | jq '.total_queries'

# Get popular questions
curl -s "http://localhost:8000/api/stats?days=7" | jq '.popular_questions'
```

---

## Interactive Documentation

When the backend is running, FastAPI automatically generates interactive API documentation:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs) — Interactive UI with "Try it out" buttons for every endpoint.
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc) — Clean, three-panel documentation layout.

These are auto-generated from the Pydantic models and FastAPI route decorators in the source code. They always reflect the latest schema definitions.

---

## Quick Reference Card

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/health` | GET | None | 20/min | System health check |
| `/api/query` | POST | None | 20/min | Ask a question via RAG |
| `/api/upload` | POST | None | 20/min | Upload and index a PDF |
| `/api/documents` | GET | None | 20/min | List all indexed documents |
| `/api/documents/{filename}` | GET | None | 20/min | Get document details |
| `/api/documents/{filename}` | DELETE | None | 20/min | Delete a document |
| `/api/stats` | GET | None | 20/min | System statistics |