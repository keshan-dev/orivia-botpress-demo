import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/contact.js';

test('onRequestPost rejects non-application/json content-type', async () => {
  const req = new Request('https://orivia-demo.pages.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'hello world'
  });

  const res = await onRequestPost({ request: req, env: {} });
  assert.equal(res.status, 415);
  const json = await res.json();
  assert.match(json.error, /application\/json/);
});

test('onRequestPost rejects malformed JSON', async () => {
  const req = new Request('https://orivia-demo.pages.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ invalid json here'
  });

  const res = await onRequestPost({ request: req, env: {} });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /Malformed JSON/);
});

test('onRequestPost rejects missing Turnstile token', async () => {
  const req = new Request('https://orivia-demo.pages.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Valid Name',
      email: 'valid@example.com',
      message: 'This is a valid inquiry message.'
    })
  });

  const res = await onRequestPost({ request: req, env: {} });
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.match(json.error, /Turnstile/);
});

test('onRequestPost accepts mock test token in ROTWATCH_TEST_MODE', async () => {
  const req = new Request('https://orivia-demo.pages.dev/api/contact', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.168.1.100'
    },
    body: JSON.stringify({
      name: 'Elena Rostova',
      email: 'elena@rostova.ch',
      message: 'Looking for a private 10-day charter in Amalfi.',
      turnstileToken: 'mock-turnstile-token-pass'
    })
  });

  const res = await onRequestPost({ 
    request: req, 
    env: { ROTWATCH_TEST_MODE: 'true' } 
  });
  
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.success, true);
  assert.ok(json.requestId);
});
