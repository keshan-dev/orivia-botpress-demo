# Third-Party Services Inventory & Risk Disclosure

This document tracks all external services integrated into the ORIVIA platform, detailing purpose, data shared, and security mitigations.

---

## 1. Inventory Matrix

| Service | Provider | Purpose | Data Transmitted | Security / Privacy Mitigations |
| :--- | :--- | :--- | :--- | :--- |
| **Botpress Cloud Webchat** | Botpress Inc. | Conversational concierge assistant | User-typed chat text, ephemeral session identifiers | Strict CSP whitelist (`*.botpress.cloud`), prominent AI disclosure banner, fallback UI when offline, zero payment credentials |
| **Cloudflare Turnstile** | Cloudflare Inc. | CAPTCHA-free human verification | Client IP, user-agent, interaction telemetry | Turnstile secret stored exclusively in server environment; validated via server-to-server API |
| **Cloudflare Pages & WAF** | Cloudflare Inc. | Edge hosting, CDN, DDoS & Bot Fight Mode | Client IP, request headers | Anycast edge mitigation; custom bypass rule for Rotwatch testing crawler |
| **Google Fonts** | Google LLC | Web typography (Playfair Display & Plus Jakarta Sans) | HTTP GET request for CSS & WOFF2 files | Subresource integrity where possible, cached headers |
| **Unsplash** | Unsplash Inc. | Curated editorial luxury travel imagery | Public image CDN requests | Whitelisted in CSP `img-src` directive |

---

## 2. Supply-Chain Security & Dependency Hygiene

- **Minimal Dependency Footprint**: ORIVIA uses Vanilla HTML5, CSS3, and modern native JavaScript. There are zero client-side npm runtime dependencies, eliminating prototype pollution and npm package supply chain risks.
- **Test Framework**: Automated test suites rely on Node's native `node:test` and `node:assert` runner.
