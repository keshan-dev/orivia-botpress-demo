import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';

test('Honeypot field triggers silent drop with 200 OK', async () => {
  const req = new Request('https://orivia-demo.pages.dev/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '10.0.0.1'
    },
    body: JSON.stringify({
      name: 'Spam Bot',
      email: 'spam@bot.com',
      message: 'Cheap luxury deals here!',
      website: 'http://spam-link.ru',
      turnstileToken: 'dummy'
    })
  });

  const res = await onRequestPost({ request: req, env: {} });
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
});

test('Rate limiting enforces 5 requests per minute maximum', async () => {
  const clientIp = '172.16.0.42';
  const makeReq = () => new Request('https://orivia-demo.pages.dev/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CF-Connecting-IP': clientIp
    },
    body: JSON.stringify({
      name: 'Test Patron',
      email: 'patron@example.com',
      message: 'Inquiry message details.',
      turnstileToken: 'mock-turnstile-token-pass'
    })
  });

  const env = { ROTWATCH_TEST_MODE: 'true' };

  // First 5 requests should pass
  for (let i = 1; i <= 5; i++) {
    const res = await onRequestPost({ request: makeReq(), env });
    assert.equal(res.status, 200, `Request ${i} should succeed`);
  }

  // 6th request must be rate limited with 429
  const limitedRes = await onRequestPost({ request: makeReq(), env });
  assert.equal(limitedRes.status, 429, '6th request must trigger rate limit 429');
  const json = await limitedRes.json();
  assert.equal(json.code, 'RATE_LIMIT_EXCEEDED');
  assert.equal(limitedRes.headers.get('Retry-After'), '60');
});

test('Security response headers are attached', async () => {
  const req = new Request('https://orivia-demo.pages.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'test'
  });

  const res = await onRequestPost({ request: req, env: {} });
  assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(res.headers.get('X-Frame-Options'), 'DENY');
  assert.ok(res.headers.get('X-Request-Id'));
});
