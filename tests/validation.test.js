import test from 'node:test';
import assert from 'node:assert/strict';

test('Email validation regex', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Valid emails
  assert.equal(emailRegex.test('guest@orivia-patron.com'), true);
  assert.equal(emailRegex.test('concierge.director@luxury-travel.org'), true);
  
  // Invalid emails
  assert.equal(emailRegex.test('plainaddress'), false);
  assert.equal(emailRegex.test('@missingusername.com'), false);
  assert.equal(emailRegex.test('username@.com'), false);
  assert.equal(emailRegex.test('spaces in@email.com'), false);
});

test('Name field constraints', () => {
  const validateName = (name) => {
    if (typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
  };

  assert.equal(validateName('Sir Arthur'), true);
  assert.equal(validateName('A'), false); // Too short
  assert.equal(validateName('   '), false); // Empty after trim
  assert.equal(validateName('a'.repeat(101)), false); // Exceeds 100 chars
});

test('Message field constraints', () => {
  const validateMessage = (msg) => {
    if (typeof msg !== 'string') return false;
    const trimmed = msg.trim();
    return trimmed.length >= 10 && trimmed.length <= 2000;
  };

  assert.equal(validateMessage('Looking for a 7-day retreat in Amalfi.'), true);
  assert.equal(validateMessage('Hi'), false); // Too short
  assert.equal(validateMessage('a'.repeat(2001)), false); // Exceeds 2000 chars
});

test('XSS script detection heuristic', () => {
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

  assert.equal(scriptRegex.test('Hello, I want to book Amalfi'), false);
  assert.equal(scriptRegex.test('<script>alert("XSS")</script>'), true);
  assert.equal(scriptRegex.test('Visit our site <script src="http://evil.com"></script> now'), true);
});
