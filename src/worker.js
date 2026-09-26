/**
 * Standalone Cloudflare Worker entry point
 * Handles /api/contact and delegates static assets to env.ASSETS
 */

import { onRequestPost, onRequestOptions } from '../functions/api/contact.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. API Route: /api/contact
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

    // 2. Static Asset Delivery via Cloudflare Workers Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  }
};
