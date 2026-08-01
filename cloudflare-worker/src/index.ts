export interface Env {
  N8N_WEBHOOK_URL: string;
  TWILIO_AUTH_TOKEN: string;
  RATE_LIMIT_KV: KVNamespace;
}

async function verifyTwilioSignature(request: Request, env: Env): Promise<boolean> {
  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature) {
    return false;
  }

  const url = new URL(request.url);
  const body = await request.clone().text();
  const parts = url.toString().split('?');
  const baseUrl = parts[0];
  const queryParams = parts.length > 1 ? parts[1] : '';

  const sortedParams = queryParams
    .split('&')
    .filter((p) => p.length > 0)
    .sort()
    .map((param) => {
      const [key, ...rest] = param.split('=');
      const value = rest.join('=');
      return `${decodeURIComponent(key)}${decodeURIComponent(value)}`;
    });

  const dataToSign = baseUrl + sortedParams.join('') + body;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(env.TWILIO_AUTH_TOKEN),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(dataToSign));
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  return computedSignature === signature;
}

async function checkRateLimit(phone: string, env: Env): Promise<{ allowed: boolean; remaining: number }> {
  const now = Math.floor(Date.now() / 60000);
  const key = `rate:${phone}:${now}`;

  const current = await env.RATE_LIMIT_KV.get<number>(key, 'json');
  const count = current || 0;
  const remaining = Math.max(0, 20 - count);

  if (count >= 20) {
    return { allowed: false, remaining: 0 };
  }

  await env.RATE_LIMIT_KV.put(key, JSON.stringify(count + 1), {
    expirationTtl: 120,
  });

  return { allowed: true, remaining: 19 - count };
}

function extractPhone(body: string): string {
  const match = body.match(/From=([^&]+)/);
  if (!match) return 'unknown';
  return decodeURIComponent(match[1]);
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Twilio-Signature',
            'Access-Control-Max-Age': '86400',
          },
        });
      }

      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405);
      }

      const isValid = await verifyTwilioSignature(request, env);
      if (!isValid) {
        return jsonResponse({ error: 'Invalid Twilio signature' }, 403);
      }

      const body = await request.text();
      const phone = extractPhone(body);

      const rateCheck = await checkRateLimit(phone, env);
      if (!rateCheck.allowed) {
        return jsonResponse(
          { error: 'Rate limit exceeded. Maximum 20 requests per minute.' },
          429
        );
      }

      const webhookResponse = await fetch(env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': request.headers.get('Content-Type') || 'application/x-www-form-urlencoded' },
        body,
      });

      const responseData = await webhookResponse.text();
      return new Response(responseData, {
        status: webhookResponse.status,
        headers: {
          'Content-Type': webhookResponse.headers.get('Content-Type') || 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'X-RateLimit-Remaining': rateCheck.remaining.toString(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return jsonResponse({ error: message }, 500);
    }
  },
};
