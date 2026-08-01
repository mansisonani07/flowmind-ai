# FlowMind AI — n8n Workflows

This directory contains importable n8n workflow JSON files for the FlowMind AI platform.

## Workflows Overview

| # | File | Workflow | Trigger |
|---|------|----------|--------|
| 1 | 01-whatsapp-query-handler.json | WhatsApp Query Handler | Webhook (POST /whatsapp) |
| 2 | 02-document-ingestion.json | Document Ingestion | Webhook (POST /ingest) |
| 3 | 03-daily-summary.json | Daily Summary Report | Schedule (9 PM UTC daily) |
| 4 | 04-weekly-analytics.json | Weekly Analytics Report | Schedule (Sunday 8 PM UTC) |

## Importing Workflows into n8n

1. Open your n8n instance (e.g., https://your-n8n.example.com)
2. Click the three dots menu in the top-right corner
3. Select Import from File
4. Upload the desired .json file from this directory
5. The workflow will appear as inactive - click Activate to enable it

## Required Environment Variables

Set these in your n8n instance environment configuration (.env file or n8n UI Settings Variables):

### Core Variables

| Variable | Description | Required |
|----------|-------------|----------|
| FASTAPI_URL | Base URL of your FlowMind FastAPI backend | Yes |

### Twilio Variables (Workflow 1)

| Variable | Description | Required |
|----------|-------------|----------|
| TWILIO_ACCOUNT_SID | Your Twilio account SID | Yes (Workflow 1) |
| TWILIO_AUTH_TOKEN | Your Twilio auth token | Yes (Workflow 1) |
| TWILIO_PHONE_NUMBER | Your Twilio WhatsApp number | Yes (Workflow 1) |

### Telegram Variables (All Workflows)

| Variable | Description | Required |
|----------|-------------|----------|
| TELEGRAM_BOT_TOKEN | Bot token from @BotFather | Yes |
| TELEGRAM_ADMIN_CHAT_ID | Your Telegram chat ID for receiving alerts | Yes |

### Google Sheets Variables (Workflows 1, 2)

| Variable | Description | Required |
|----------|-------------|----------|
| GOOGLE_SHEETS_ID | ID of the Google Spreadsheet for logging | Yes (Workflows 1, 2) |

### Email Variables (Workflow 4)

| Variable | Description | Required |
|----------|-------------|----------|
| ADMIN_EMAIL | Email address for weekly report delivery | Optional |
| SENDER_DOMAIN | Custom sender domain for email | Optional |

## Twilio Webhook Configuration

### Pointing Twilio to n8n

1. In the Twilio Console, go to Messaging, then WhatsApp, then Sandbox
2. Set the WHEN A MESSAGE COMES IN webhook URL to:
   https://your-n8n-instance.com/webhook/whatsapp
3. If using the Cloudflare Worker proxy, use the Worker URL instead:
   https://flowmind-webhook-proxy.your-subdomain.workers.dev

### Setting Up Twilio Credentials in n8n

1. In n8n, go to Credentials then Add Credential
2. Search for Header Auth or HTTP Basic Auth
3. Create a credential with your TWILIO_ACCOUNT_SID as username and TWILIO_AUTH_TOKEN as password
4. Name it Twilio API to match the workflow references

## Google Sheets Integration Setup

### Prepare the Spreadsheet

1. Create a new Google Spreadsheet
2. Create two sheets:
   - Conversations with columns: Timestamp, User Phone, Question, Answer, Confidence, Escalated
   - DocumentUploads with columns: Timestamp, Filename, File URL, Status, Chunks Created, Error
3. Copy the Spreadsheet ID from the URL

### Connect in n8n

1. Go to Credentials then Add Credential
2. Search for Google Sheets OAuth2
3. Follow the OAuth flow to authenticate
4. Name it Google Sheets API to match the workflow references

## How to Test Each Workflow

### Workflow 1: WhatsApp Query Handler

curl -X POST https://your-n8n-instance.com/webhook/whatsapp \\
  -H Content-Type: application/x-www-form-urlencoded \\
  -d Body=What+are+your+business+hours%3F&From=whatsapp%3A%2B1234567890&MessageSid=SMtest123

Expected: The workflow should query the RAG engine and send a WhatsApp response.

### Workflow 2: Document Ingestion

curl -X POST https://your-n8n-instance.com/webhook/ingest \\
  -H Content-Type: application/json \\
  -d '{"file_url": "https://example.com/document.pdf", "filename": "test-document.pdf"}'

Expected: The workflow should upload the document to FastAPI, notify Telegram, and log the event.

### Workflow 3: Daily Summary

1. Open the workflow in n8n
2. Click the Test workflow button on the Schedule Trigger node
3. This will manually trigger the daily fetch and send a summary to Telegram

### Workflow 4: Weekly Analytics

1. Open the workflow in n8n
2. Click Test workflow on the Schedule Trigger node
3. This will manually trigger the weekly fetch and send reports to both Telegram and Gmail

## Troubleshooting

- Webhook not triggering: Ensure the workflow is activated in n8n UI
- Twilio 401 error: Verify your Twilio credentials in n8n Credentials
- Google Sheets permission error: Re-authenticate the Google Sheets OAuth2 credential
- Environment variables not found: Check that variables are set in n8n Settings Variables
- Timeout errors: Increase the timeout in HTTP Request nodes
