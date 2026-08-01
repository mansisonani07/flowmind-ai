# n8n Workflows

Detailed guide to the four n8n workflows that power FlowMind AI's WhatsApp automation, document ingestion, and reporting. All workflow JSON files are located in the `n8n-workflows/` directory at the project root.

---

## How to Import All Workflows

1. Open your n8n instance at `http://localhost:5678` (local) or your Railway/deployed URL.
2. Click the **three-dot menu** (⋮) in the top-right corner.
3. Select **Import from File**.
4. Select the `.json` file from the `n8n-workflows/` directory.
5. The workflow appears in the editor — it will be **inactive** by default.
6. Click the **Activate** toggle (top-right) to start the workflow.
7. Repeat for each workflow file.

> **Important**: After importing, open each workflow and verify that environment variable references (e.g., `{{$env.FASTAPI_URL}}`) resolve correctly in your n8n environment. n8n environment variables are set in the n8n `.env` file or in the Docker Compose `environment` block.

---

## Workflow 1: WhatsApp Query Handler

**File**: `n8n-workflows/01-whatsapp-query-handler.json`  
**Nodes**: 8  
**Status**: Active (webhook-based)

### Purpose

This is the **primary workflow** and the heart of FlowMind AI. It receives incoming WhatsApp messages forwarded by Twilio, queries the FlowMind RAG engine for an answer, and sends the response back to the customer via WhatsApp. If the AI confidence is below the threshold, it sends a graceful fallback message to the customer and escalates the conversation to a human agent by alerting the admin on Telegram. All conversations are logged to Google Sheets for analytics.

### Trigger

**Webhook** — `POST /webhook/whatsapp`

Triggered automatically when Twilio sends an incoming WhatsApp message event to the configured webhook URL. The webhook URL in your Twilio Console should point to: `https://<your-n8n-instance>/webhook/whatsapp`

The webhook receives `application/x-www-form-urlencoded` data from Twilio with the following key fields:
- `Body` — The text message from the customer
- `From` — The sender's WhatsApp number (prefixed with `whatsapp:`)
- `MessageSid` — Unique Twilio message identifier
- `ProfileName` — The sender's WhatsApp display name (if available)

### Node-by-Node Breakdown (8 Nodes)

| # | Node Name | Type | Description |
|---|-----------|------|-------------|
| 1 | **Webhook Trigger** | Webhook | Receives the Twilio POST payload. Path is set to `/webhook/whatsapp`. Accepts `application/x-www-form-urlencoded`. This is the entry point for all incoming WhatsApp messages. |
| 2 | **Extract Twilio Fields** | Set | Parses the raw Twilio webhook payload. Extracts `Body` (the message text) and `From` (the sender phone number). Strips the `whatsapp:` prefix from the phone number so it becomes a clean E.164 format (e.g., `+1234567890`). |
| 3 | **Query RAG Engine** | HTTP Request | Sends a POST request to `{{$env.FASTAPI_URL}}/api/query` with JSON body `{{"question": "{{Body}}", "user_phone": "{{From}}"}}`. Expects a JSON response containing `answer`, `confidence`, `sources`, and `escalated` fields. Timeout is set to 30 seconds. |
| 4 | **Check Confidence** | IF | Branches based on the `escalated` boolean field from the RAG response. If `escalated` is `false` (confidence ≥ 0.5), the flow goes to **Node 5** (Send Answer). If `escalated` is `true` (confidence < 0.5), the flow goes to **Node 6** (Send Escalation Message). |
| 5 | **Send Answer** | Twilio | Sends the AI-generated answer back to the customer via the Twilio WhatsApp API. Uses the `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` credentials. The message body is set to `{{answer}}` from the RAG response. |
| 6 | **Send Escalation Message** | Twilio | Sends a human-friendly fallback message to the customer: "I'm not sure about that. Let me connect you with a team member who can help." This maintains a good customer experience even when the AI cannot answer. |
| 7 | **Alert Admin on Telegram** | Telegram | Sends an escalation alert to the admin's Telegram chat. The message includes the customer's phone number, their original question, the AI's attempted answer, and the confidence score. This allows a human agent to follow up. |
| 8 | **Log Conversation** | Google Sheets | Appends a row to the "Conversations" sheet in the configured Google Spreadsheet. Columns logged: `Timestamp`, `User Phone`, `Question`, `Answer`, `Confidence`, `Escalated`. This data powers the analytics dashboard and reporting workflows. |

> **Note**: The webhook responds with a 200 status and TwiML `<Response/>` to acknowledge receipt. This is handled within the Webhook Trigger node's "Respond to Webhook" setting, not as a separate node.

### Required Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `FASTAPI_URL` | `http://backend:8000` | Backend API base URL (use Docker service name in Compose) |
| `TWILIO_ACCOUNT_SID` | `ACxxxxxxxxxxxx` | Your Twilio account SID from the Twilio Console |
| `TWILIO_AUTH_TOKEN` | `xxxxxxxxxxxx` | Your Twilio auth token (keep secret) |
| `TWILIO_PHONE_NUMBER` | `+14155552671` | Your Twilio WhatsApp-enabled phone number |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` | Telegram bot token from @BotFather |
| `TELEGRAM_ADMIN_CHAT_ID` | `987654321` | Your Telegram chat ID (numeric) for receiving alerts |
| `GOOGLE_SHEETS_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms` | Google Sheets spreadsheet ID for logging |

### How to Test

```bash
# Simulate an incoming WhatsApp message from Twilio
curl -X POST https://your-n8n-instance.com/webhook/whatsapp \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Body=What+are+your+business+hours%3F" \
  -d "From=whatsapp%3A%2B1234567890" \
  -d "MessageSid=SMtest123" \
  -d "ProfileName=John+Doe"
```

Verify the following after sending:
1. Check the n8n execution log — all 8 nodes should show green (success).
2. The customer (your test phone) should receive a WhatsApp reply with the AI answer.
3. The Google Sheet should have a new row with the conversation details.
4. If the question was obscure (low confidence), check Telegram for the escalation alert.

---

## Workflow 2: Document Ingestion

**File**: `n8n-workflows/02-document-ingestion.json`  
**Nodes**: 4  
**Status**: Active (webhook-based)

### Purpose

Handles **programmatic document upload** to the RAG system. When triggered, it downloads a PDF from a specified URL and uploads it to the FastAPI backend for indexing. This is useful for automated document pipelines — for example, a nightly job that pulls the latest price list from a Google Drive and indexes it.

### Trigger

**Webhook** — `POST /webhook/ingest`

Triggered by an external system, a scheduled n8n workflow, or manually via cURL. The webhook accepts JSON with `file_url` and `filename` fields.

### Node-by-Node Breakdown (4 Nodes)

| # | Node Name | Type | Description |
|---|-----------|------|-------------|
| 1 | **Ingest Webhook** | Webhook | Receives a JSON POST with two fields: `file_url` (the URL of the PDF to download) and `filename` (the name to store it as). Validates that both fields are present and non-empty. |
| 2 | **Download & Upload to FastAPI** | HTTP Request | Downloads the PDF file from the `file_url` and forwards it as `multipart/form-data` to `{{$env.FASTAPI_URL}}/api/upload`. The file field is named `file`. This node handles the download-buffer-upload sequence in a single operation. |
| 3 | **Notify Admin on Telegram** | Telegram | Sends a confirmation message to the admin's Telegram chat with the filename and the number of chunks created (from the upload response). Example: "📄 Document 'menu.pdf' indexed — 23 chunks created." |
| 4 | **Log Upload Event** | Google Sheets | Appends a row to the "DocumentUploads" sheet. Columns: `Timestamp`, `Filename`, `Source URL`, `Chunks Created`, `Status`. This maintains an audit trail of all document ingestions. |

### Required Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `FASTAPI_URL` | `http://backend:8000` | Backend API base URL |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` | Telegram bot token for notifications |
| `TELEGRAM_ADMIN_CHAT_ID` | `987654321` | Admin Telegram chat ID |
| `GOOGLE_SHEETS_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms` | Google Sheets spreadsheet ID |

### How to Test

```bash
# Ingest a PDF from a public URL
curl -X POST https://your-n8n-instance.com/webhook/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "filename": "test-document.pdf"
  }'
```

Verify:
1. The n8n execution log shows all 4 nodes succeeding.
2. The Telegram bot sends a confirmation with the filename and chunk count.
3. The Google Sheet has a new row in the DocumentUploads tab.
4. The document appears in `GET /api/documents` on the backend.

---

## Workflow 3: Daily Summary

**File**: `n8n-workflows/03-daily-summary.json`  
**Nodes**: 4  
**Status**: Active (scheduled)

### Purpose

Sends a **daily summary** of conversation activity to the admin's Telegram at 9:00 PM UTC every day. This gives the business owner a quick snapshot of how the AI assistant performed: how many queries were handled, the average confidence, how many escalated, and the most popular questions.

### Trigger

**Schedule** — Cron: `0 21 * * *` (every day at 9:00 PM UTC)

The cron expression runs at 21:00 UTC daily, which corresponds to convenient evening hours in most time zones. Adjust the cron expression if you prefer a different local time.

### Node-by-Node Breakdown (4 Nodes)

| # | Node Name | Type | Description |
|---|-----------|------|-------------|
| 1 | **Schedule Trigger** | Schedule (Cron) | Fires every day at 9:00 PM UTC. The cron expression is `0 21 * * *`. In n8n, this is configured as a Schedule Trigger node with mode set to "Cron". |
| 2 | **Fetch Daily Stats** | HTTP Request | Sends `GET {{$env.FASTAPI_URL}}/api/stats?days=1` to retrieve today's statistics. The response includes `total_queries`, `avg_confidence`, `escalation_rate`, `popular_questions`, and `daily_query_count`. |
| 3 | **Format Summary Message** | Code (JavaScript) | A JavaScript Code node that transforms the raw JSON stats into a human-readable Telegram message with bullet points, emojis, and sections. Handles edge cases like zero queries (no data to report). |
| 4 | **Send Daily Summary** | Telegram | Sends the formatted summary message to the admin's Telegram chat. The message typically looks like:

```
📊 Daily Summary — Jan 15, 2025

🤖 Total Queries: 24
✅ Avg Confidence: 0.89
⚠️ Escalations: 2 (8.3%)
⏱️ Avg Response: 280ms

🔥 Top Questions:
1. What are your hours?
2. Do you have vegan options?
3. Where are you located?
``` |

### Required Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `FASTAPI_URL` | `http://backend:8000` | Backend API base URL |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` | Telegram bot token |
| `TELEGRAM_ADMIN_CHAT_ID` | `987654321` | Admin Telegram chat ID |

### How to Test

1. Open the Daily Summary workflow in the n8n editor.
2. Click the **Test workflow** button on the Schedule Trigger node (the play icon).
3. n8n will execute the entire pipeline immediately, regardless of the schedule.
4. Check your Telegram for the summary message.
5. If no queries were processed today, the message will indicate zero activity.

---

## Workflow 4: Weekly Analytics

**File**: `n8n-workflows/04-weekly-analytics.json`  
**Nodes**: 5  
**Status**: Active (scheduled)

### Purpose

Sends a detailed **weekly analytics report** every Sunday at 8:00 PM UTC. This is a more comprehensive report than the daily summary, including weekly query volume trends, daily breakdowns, confidence trends, escalation rates, and the top 5 questions for the week. The report is delivered via both Telegram and (optionally) email.

### Trigger

**Schedule** — Cron: `0 20 * * 0` (every Sunday at 8:00 PM UTC)

The cron expression `0 20 * * 0` means: minute 0, hour 20 (8 PM), every day of the month, every month, day-of-week 0 (Sunday). This delivers the report at the end of each week.

### Node-by-Node Breakdown (5 Nodes)

| # | Node Name | Type | Description |
|---|-----------|------|-------------|
| 1 | **Schedule Trigger** | Schedule (Cron) | Fires every Sunday at 8:00 PM UTC. Cron expression: `0 20 * * 0`. |
| 2 | **Fetch Weekly Stats** | HTTP Request | Sends `GET {{$env.FASTAPI_URL}}/api/stats?days=7` to retrieve the last 7 days of statistics. The response includes daily query counts, average confidence, escalation rate, popular questions, and total query volume. |
| 3 | **Format Weekly Report** | Code (JavaScript) | A JavaScript Code node that formats a comprehensive multi-section weekly report. Sections include: (1) Weekly Overview with key metrics, (2) Daily Query Volume breakdown with trend indicators (↑/↓), (3) Top 5 Questions, (4) Escalation Analysis. Handles zero-data edge cases gracefully. |
| 4 | **Send to Telegram** | Telegram | Sends the formatted weekly report to the admin's Telegram chat. The report is formatted with Markdown-style bold headers, bullet points, and emoji indicators for a clean, scannable format. |
| 5 | **Send via Gmail** | Gmail | (Optional) Sends the same report via email if Gmail credentials are configured in n8n. The email subject is "📊 FlowMind Weekly Report — [date range]". This node is configured to silently skip if Gmail credentials are not set up, so it won't break the workflow. |

### Required Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `FASTAPI_URL` | `http://backend:8000` | Backend API base URL |
| `TELEGRAM_BOT_TOKEN` | `123456:ABC-DEF...` | Telegram bot token |
| `TELEGRAM_ADMIN_CHAT_ID` | `987654321` | Admin Telegram chat ID |
| `GMAIL_USER` | `you@gmail.com` | (Optional) Gmail address for email delivery |
| `GMAIL_APP_PASSWORD` | `xxxx xxxx xxxx xxxx` | (Optional) Gmail app-specific password |

### How to Test

1. Open the Weekly Analytics workflow in the n8n editor.
2. Click **Test workflow** on the Schedule Trigger node.
3. Check your Telegram for the weekly report.
4. If Gmail is configured, check your inbox for the email version.

---

## Workflow Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    FlowMind AI n8n Workflows                  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐                                          │
│  │  Workflow 1:    │   Triggered by Twilio webhook            │
│  │  WhatsApp Query │   (incoming WhatsApp messages)           │
│  │  Handler (8)    │                                          │
│  └────────┬────────┘                                          │
│           │                                                    │
│           ▼                                                    │
│  ┌────────────────┐     ┌─────────────────┐                   │
│  │  FastAPI       │◄────│  Workflow 2:    │                   │
│  │  Backend       │     │  Document       │                   │
│  │  /api/*        │     │  Ingestion (4)  │                   │
│  └───────┬────────┘     └─────────────────┘                   │
│          │                                                    │
│     ┌────┴────┐                                               │
│     ▼         ▼                                               │
│  ┌─────────┐ ┌──────────────┐                                 │
│  │Workflow3│ │  Workflow 4: │                                 │
│  │ Daily   │ │  Weekly      │                                 │
│  │ Summary │ │  Analytics   │                                 │
│  │ (4)     │ │  (5)         │                                 │
│  └─────────┘ └──────────────┘                                 │
│                                                                │
│  Shared services: Telegram, Google Sheets, FastAPI backend    │
└──────────────────────────────────────────────────────────────┘
```

The workflows are **independent** (they do not call each other) but share:
- **Environment variables**: `FASTAPI_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `GOOGLE_SHEETS_ID`
- **Credentials**: Twilio, Telegram, and Google Sheets credentials configured in n8n
- **Data source**: All read from the same FastAPI backend

---

## How to Modify Workflows

Since n8n provides a visual drag-and-drop editor, you can customize workflows without writing code:

### Add a New Response Channel

To also send answers via SMS, email, or Slack:
1. Open **Workflow 1** (WhatsApp Query Handler).
2. After the **Send Answer** node, add a new node (e.g., Slack, Email, or SMS).
3. Connect the output of **Send Answer** to the new node.
4. Map the `answer` field from the RAG response to the new node's message body.

### Change the Escalation Confidence Threshold

The confidence threshold is checked in two places:
1. **n8n IF node** (Workflow 1, Node 4): Controls whether to send the AI answer or the escalation message. Edit the condition value (default: `false` for the `escalated` field — this is controlled by the backend's `CONFIDENCE_THRESHOLD`).
2. **Backend `.env`**: Set `CONFIDENCE_THRESHOLD=0.6` to make the system more cautious (more escalations) or `CONFIDENCE_THRESHOLD=0.3` to be more permissive.

### Add Custom Question Routing

To handle specific keywords ("order", "book", "cancel") with custom flows:
1. Insert a **Switch node** between **Extract Twilio Fields** (Node 2) and **Query RAG Engine** (Node 3).
2. Add routes for keywords like `order`, `book`, `cancel`.
3. Connect the default route to the existing **Query RAG Engine** node.
4. Connect keyword-specific routes to custom response nodes or external API calls.

### Change Report Schedules

Edit the cron expression in the Schedule Trigger node:
- Daily at 6 PM EST: `0 23 * * *` (EST = UTC - 5)
- Daily at 9 AM IST: `0 3 * * *` (IST = UTC + 5:30)
- Monthly on the 1st: `0 21 1 * *`

### Add New Logging Destinations

To log conversations to Notion, Airtable, or any other service:
1. Add a new node (e.g., Notion, Airtable, HTTP Request) after the **Log Conversation** node.
2. Map the same fields: `Timestamp`, `Phone`, `Question`, `Answer`, `Confidence`, `Escalated`.
3. Configure the node's credentials and target database/table.

### Export and Version Control

To track workflow changes:
1. In n8n, click the three-dot menu > **Download** to export the workflow as JSON.
2. Commit the updated JSON file to your Git repository.
3. This makes it easy to revert changes or deploy workflow updates alongside code changes.
