/**
 * Standalone Cloudflare Worker entry point
 * Exports fetch handler routing to /api/contact or serving static assets
 */

import { onRequestPost, onRequestOptions } from '../functions/api/contact.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method === 'POST') {
        return onRequestPost({ request, env, ctx });
      }
      if (request.method === 'OPTIONS') {
        return onRequestOptions();
      }
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};
