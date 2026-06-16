# Production Roadmap

These are optional, incremental improvements once the MVP is live. None of
them are required for Kyzen API to work — they're here so future-you has a
clear menu of "what's next" without over-engineering the initial release.

## 1. Real AI provider for `/api/ai/*`
- Replace the stubbed logic in `workers/api/src/routes/ai.ts` with a call to
  your preferred LLM provider, wrapped in `fetchWithRetry`.
- Store the provider's API key as a Worker secret: `wrangler secret put AI_API_KEY`.
- Add a short response cache in KV for identical prompts to reduce cost.

## 2. API keys & per-key rate limits (optional)
- Kyzen is keyless by design, but if abuse becomes an issue:
  - Add an `API_KEYS` KV namespace mapping key → plan (free/pro).
  - Extend `rateLimit` middleware to look up the key's limit instead of a
    single global default.
- Keep the **default (no key)** tier working, so the API stays "no signup
  required" for casual use.

## 3. Cloudflare D1 for persistent data
Move from KV to D1 (SQLite at the edge) once you need:
- **Short URL click analytics** — table `short_links(code, url, clicks, created_at)`.
- **Usage analytics** — table `requests(path, status, ip_hash, created_at)` for
  a richer status page.
- **Saved playground history** (optional, per-browser via localStorage first —
  only move to D1 if you add accounts).

D1 is the recommended database because it requires no new infrastructure: it's
provisioned the same way as KV, with `wrangler d1 create`.

## 4. Improved status page
- Add a small cron-triggered Worker (`wrangler.toml` `[triggers] crons`) that
  pings each route every few minutes and writes results to D1.
- Render an uptime percentage (last 24h / 7d / 30d) and a simple incident log
  on `/status`.

## 5. Observability
- Enable Cloudflare Logpush for the worker to ship structured logs (already
  JSON via `requestLogger`) to a log sink of your choice.
- Add basic alerting (e.g. a scheduled Worker that checks `/api/status` and
  notifies you via a webhook if it's down).

## 6. Sliding-window / Durable Object rate limiting
- The current fixed-window KV limiter is good enough for personal-scale
  traffic. If you start seeing burst abuse at window boundaries, replace it
  with a Durable Object per IP for accurate sliding-window limits.

## 7. CI/CD
- GitHub Actions workflow:
  - `lint` + `typecheck` on every PR
  - `wrangler deploy` for `workers/api` on merge to `main`
  - Cloudflare Pages auto-deploys `apps/web` on push (built in, no extra config)

## 8. Versioning
- If breaking changes are needed later, mount a new route group under
  `/api/v2/*` rather than changing `/api/v1/*` (currently unversioned `/api/*`)
  in place — keeps existing bots/integrations working.

## 9. Self-hosted QR generation
- `/api/tools/qrcode` currently proxies a public QR service. For full
  independence, vendor a small QR-encoding library (pure JS, no native deps)
  and render the SVG in-worker, the same way `/api/image/*` does.

## 10. Security polish
- Add `Content-Security-Policy` and other security headers to `apps/web` via
  Cloudflare Pages `_headers` file.
- Add a `robots.txt` and `sitemap.xml` for the website.
