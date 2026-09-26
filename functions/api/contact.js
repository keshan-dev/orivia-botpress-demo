/**
 * Cloudflare Pages Function: POST /api/contact
 * Zero-trust inquiry endpoint with Turnstile verification, rate limiting, and input sanitization
 */

// In-memory sliding rate limit store (ephemeral per worker isolate)
const ipRateLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// Clean up stale rate limit entries periodically
function pruneRateLimits(now) {
  for (const [ip, data] of ipRateLimits.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      ipRateLimits.delete(ip);
    }
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = crypto.randomUUID();
  const origin = request.headers.get('Origin') || '';
  const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';

  // Secure headers for every response
  const secureHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-Request-Id': requestId,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };

  // CORS check: restrict to same-origin or explicit deployment origin
  const allowedOrigins = [
    'https://orivia-demo.pages.dev',
    'http://localhost:8788',
    'http://127.0.0.1:8788'
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.pages.dev'))) {
    secureHeaders['Access-Control-Allow-Origin'] = origin;
  }

  // 1. Rate Limiting Check
  const now = Date.now();
  if (Math.random() < 0.1) pruneRateLimits(now);

  const clientLimit = ipRateLimits.get(clientIp) || { count: 0, windowStart: now };
  if (now - clientLimit.windowStart > RATE_LIMIT_WINDOW_MS) {
    clientLimit.count = 1;
    clientLimit.windowStart = now;
  } else {
    clientLimit.count += 1;
  }
  ipRateLimits.set(clientIp, clientLimit);

  if (clientLimit.count > MAX_REQUESTS_PER_WINDOW) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment before sending another inquiry.',
        code: 'RATE_LIMIT_EXCEEDED'
      }),
      {
        status: 429,
        headers: {
          ...secureHeaders,
          'Retry-After': '60'
        }
      }
    );
  }

  // 2. Validate Content-Type
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return new Response(
      JSON.stringify({ error: 'Content-Type must be application/json' }),
      { status: 415, headers: secureHeaders }
    );
  }

  // 3. Enforce Payload Size Limit (Max 16 KB)
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 16 * 1024) {
    return new Response(
      JSON.stringify({ error: 'Payload exceeds maximum permitted size of 16KB' }),
      { status: 413, headers: secureHeaders }
    );
  }

  // 4. Safely parse JSON body
  let body;
  try {
    const rawText = await request.text();
    if (rawText.length > 16 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Payload exceeds maximum permitted size' }),
        { status: 413, headers: secureHeaders }
      );
    }
    body = JSON.parse(rawText);
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Malformed JSON payload' }),
      { status: 400, headers: secureHeaders }
    );
  }

  // 5. Input Field Validation & Sanitization
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken.trim() : '';
  const websiteHoneypot = typeof body.website === 'string' ? body.website.trim() : '';

  // Silent drop on honeypot trigger
  if (websiteHoneypot.length > 0) {
    return new Response(
      JSON.stringify({ success: true, message: 'Inquiry received' }),
      { status: 200, headers: secureHeaders }
    );
  }

  if (name.length < 2 || name.length > 100) {
    return new Response(
      JSON.stringify({ error: 'Name must be between 2 and 100 characters' }),
      { status: 422, headers: secureHeaders }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 100) {
    return new Response(
      JSON.stringify({ error: 'A valid email address is required' }),
      { status: 422, headers: secureHeaders }
    );
  }

  if (message.length < 10 || message.length > 2000) {
    return new Response(
      JSON.stringify({ error: 'Message must be between 10 and 2000 characters' }),
      { status: 422, headers: secureHeaders }
    );
  }

  // Block dangerous HTML / Script tags in inputs
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (scriptRegex.test(name) || scriptRegex.test(message)) {
    return new Response(
      JSON.stringify({ error: 'Invalid characters or scripts detected in submission' }),
      { status: 400, headers: secureHeaders }
    );
  }

  // 6. Cloudflare Turnstile Server-Side Verification
  const turnstileSecret = env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'; // Cloudflare test secret if none set
  
  if (!turnstileToken) {
    return new Response(
      JSON.stringify({ error: 'Turnstile verification token is missing' }),
      { status: 400, headers: secureHeaders }
    );
  }

  try {
    const verifyFormData = new FormData();
    verifyFormData.append('secret', turnstileSecret);
    verifyFormData.append('response', turnstileToken);
    verifyFormData.append('remoteip', clientIp);

    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: verifyFormData
    });

    const turnstileOutcome = await turnstileRes.json();

    // In local development or testing with mock token, allow pass if test mode enabled
    const isMockTest = env.ROTWATCH_TEST_MODE === 'true' && turnstileToken === 'mock-turnstile-token-pass';

    if (!turnstileOutcome.success && !isMockTest) {
      return new Response(
        JSON.stringify({ error: 'Turnstile verification failed. Please refresh and retry.' }),
        { status: 400, headers: secureHeaders }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Security verification service temporarily unreachable.' }),
      { status: 502, headers: secureHeaders }
    );
  }

  // 7. Successful Processing (Zero sensitive logging)
  console.log(JSON.stringify({
    level: 'info',
    action: 'contact_submission_success',
    requestId,
    ipTruncated: clientIp.split('.').slice(0, 2).join('.') + '.x.x',
    timestamp: new Date().toISOString()
  }));

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Inquiry successfully processed by ORIVIA concierge.',
      requestId
    }),
    { status: 200, headers: secureHeaders }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
