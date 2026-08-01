# FlowMind Webhook Proxy — Cloudflare Worker

A lightweight Cloudflare Worker that sits in front of your n8n webhook, handling Twilio signature verification and rate limiting before forwarding requests to your n8n instance.

## Why This Worker Exists

- **Twilio Signature Verification**: Validates incoming webhook requests using HMAC-SHA1 to ensure they actually come from Twilio
- **Rate Limiting**: Prevents abuse by limiting each phone number to 20 requests per minute using Cloudflare KV
- **CORS Support**: Handles preflight OPTIONS requests for cross-origin compatibility
- **Low Latency**: Runs on Cloudflare's edge network, adding minimal latency

## Setup Instructions

### 1. Install Dependencies

```bash
cd cloudflare-worker
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

### 3. Create a KV Namespace for Rate Limiting

```bash
npx wrangler kv namespace create "RATE_LIMIT_KV"
```

This will output a namespace ID. Update wrangler.toml:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "YOUR_ACTUAL_NAMESPACE_ID_HERE"
```

### 4. Set Environment Variables

Edit wrangler.toml to set your n8n webhook URL:

```toml
[vars]
N8N_WEBHOOK_URL = "https://your-n8n-instance.com/webhook/whatsapp"
```

For the TWILIO_AUTH_TOKEN, use a secret:

```bash
npx wrangler secret put TWILIO_AUTH_TOKEN
```

It will prompt you to enter the value.

### 5. Deploy

```bash
npx wrangler deploy
```

The output will show your Worker URL, e.g.:
```
https://flowmind-webhook-proxy.your-subdomain.workers.dev
```

### 6. Configure Twilio Webhook URL

In the Twilio Console:
1. Go to Messaging, then WhatsApp, then Sandbox (or your configured number)
2. Set WHEN A MESSAGE COMES IN to your Worker URL

## Environment Variables

| Variable | Location | Description |
|----------|----------|-------------|
| N8N_WEBHOOK_URL | wrangler.toml [vars] | Full URL of your n8n webhook endpoint |
| TWILIO_AUTH_TOKEN | wrangler secret | Your Twilio account auth token |
| RATE_LIMIT_KV | wrangler.toml [[kv_namespaces]] | KV namespace for rate limit counters |

## Local Development

```bash
npx wrangler dev
```

This starts a local dev server. You can test with curl.

### Testing with curl

Send a test request (note: signature verification requires a valid Twilio signature, so direct curl to the Worker will return 403 unless you compute the signature correctly):

```bash
# Test rate limit (will return 403 due to missing signature)
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=whatsapp:%2B1234567890&Body=Hello"

# Test CORS preflight
curl -X OPTIONS http://localhost:8787 -i

# Test method not allowed
curl -X GET http://localhost:8787 -i
```

To test with a real Twilio signature, use the Twilio CLI:

```bash
twilio phone-numbers:update +1XXXXXXXXXX --sms-url=https://flowmind-webhook-proxy.your-subdomain.workers.dev
```

## Rate Limiting Details

- Each phone number is limited to **20 requests per minute**
- Rate limit keys are scoped to minute buckets: rate:{phone}:{minute_timestamp}
- KV entries expire after 120 seconds (2 minutes) to auto-cleanup
- Responses include an X-RateLimit-Remaining header

## Architecture

```
Twilio --> Cloudflare Worker --> n8n Webhook --> FastAPI Backend
              (signature verify)    (orchestrate)    (RAG engine)
              (rate limit)
```

## Error Responses

| Status | Meaning |
|--------|---------|
| 200 | Success — forwarded to n8n and got a response |
| 204 | CORS preflight acknowledged |
| 403 | Invalid Twilio signature |
| 405 | Method not allowed (only POST accepted) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
