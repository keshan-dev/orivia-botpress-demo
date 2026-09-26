# ORIVIA — Security Baseline & Policy

## 1. Security Overview

ORIVIA is designed with defense-in-depth across frontend assets, third-party integrations, and edge worker APIs.

### Perimeter & Network Controls
- **Edge Deployment**: Hosted on Cloudflare Pages global anycast network with automated TLS 1.3 and HSTS preloading.
- **Anti-Bot Defense**: Cloudflare Bot Fight Mode and Managed WAF protection.
- **Turnstile Verification**: Server-to-server challenge validation enforcing human submission on all contact inquiries.

### First-Party API Security (`POST /api/contact`)
- **Strict Size Limits**: 16KB payload cap to mitigate memory exhaustion and ReDoS attacks.
- **Content-Type Enforcement**: Rejects any non-`application/json` payloads with `415 Unsupported Media Type`.
- **Schema Sanitization**: Regex bounds on name, email, and message; strips control characters.
- **Script Tag Blocking**: Rejects inputs containing embedded `<script>` tags.
- **Sliding-Window Rate Limiting**: Maximum 5 submissions per minute per client IP. Returns `429 Too Many Requests` with `Retry-After: 60`.
- **Honeypot Trap**: Invisible `website` field traps automated spam scrapers with silent drop.
- **Zero Sensitive Logging**: Full message contents and Turnstile secret keys are never written to logs or headers.

### Third-Party AI Sandbox (Botpress Cloud Webchat)
- **Domain Whitelisting**: Content-Security-Policy strictly whitelists `*.botpress.cloud`, `challenges.cloudflare.com`, and `'self'`.
- **No Client Secrets**: Botpress operates strictly using public client/bot IDs. All administrative API keys remain server-side.
- **DOM Safety**: All dynamic DOM manipulations use `textContent`, `setAttribute`, and `appendChild`. `eval()`, `new Function()`, and `document.write()` are prohibited.
- **Transparent AI Disclosure**: Clear warning displayed beside chat widget instructing users not to input payment or confidential data.

---

## 2. Content Security Policy (CSP)

Configured in `public/_headers`:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://files.botpress.cloud https://cdn.botpress.cloud https://*.botpress.cloud; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.botpress.cloud; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https://images.unsplash.com https://*.botpress.cloud; connect-src 'self' https://challenges.cloudflare.com https://*.botpress.cloud wss://*.botpress.cloud; frame-src 'self' https://challenges.cloudflare.com https://*.botpress.cloud; object-src 'none'; base-uri 'self'; form-action 'self';
```

---

## 3. Reporting a Vulnerability

To report a vulnerability or potential security defect in this demonstration platform, please contact:
- **Email**: `security@orivia-demo.pages.dev`
- **Response SLA**: Initial triage within 24 hours.
