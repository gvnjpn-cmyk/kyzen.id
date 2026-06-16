# Deployment Guide

Kyzen API deploys to two Cloudflare products:

- **`workers/api`** → Cloudflare Workers (the REST API)
- **`apps/web`** → Cloudflare Pages (the website)

Both can be managed from a phone via the Cloudflare dashboard and/or the
Wrangler CLI from any machine.

---

## 1. Prerequisites

- A Cloudflare account.
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) installed
  (`npm install -g wrangler`) and logged in (`wrangler login`).
- Node.js 18+.

---

## 2. Deploy the API (`workers/api`)

### 2.1 Install dependencies
```bash
cd kyzen-api
npm install
```

### 2.2 Create KV namespaces
```bash
wrangler kv namespace create "RATE_LIMIT_KV"
wrangler kv namespace create "SHORTURL_KV"
```

Copy the returned `id` values into `workers/api/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "<paste id here>"

[[kv_namespaces]]
binding = "SHORTURL_KV"
id = "<paste id here>"
```

### 2.3 (Optional) Add secrets
Only needed if you wire up a real AI provider or a keyed weather/currency API:
```bash
wrangler secret put AI_API_KEY
wrangler secret put OPENWEATHER_API_KEY
wrangler secret put EXCHANGE_RATE_API_KEY
```

### 2.4 Deploy
```bash
cd workers/api
wrangler deploy
```

This publishes the worker to `https://kyzen-api.<your-subdomain>.workers.dev`.

### 2.5 (Optional) Custom domain
In `wrangler.toml`, uncomment and update the `routes` section:
```toml
routes = [
  { pattern = "api.kyzen.dev/*", zone_name = "kyzen.dev" }
]
```
Then add `kyzen.dev` to your Cloudflare account and re-run `wrangler deploy`.

### 2.6 Verify
```bash
curl https://api.kyzen.dev/api/status
curl "https://api.kyzen.dev/api/fun/jokes"
```
Both should return the standard `{ success, creator, result }` envelope.
Visit `https://api.kyzen.dev/docs` for Swagger UI.

---

## 3. Deploy the website (`apps/web`)

### 3.1 Update the API base URL
`packages/shared/src/constants.ts` exports `API_BASE_URL`. Before building,
make sure it points at your deployed worker (e.g.
`https://api.kyzen.dev` or `https://kyzen-api.<subdomain>.workers.dev`).

### 3.2 Connect to Cloudflare Pages (recommended)
1. Push this repository to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect
   to Git**.
3. Select the repository, and configure:
   - **Framework preset**: Astro
   - **Build command**: `npm run build --workspace apps/web`
   - **Build output directory**: `apps/web/dist`
   - **Root directory**: `/` (this is a monorepo, keep the root)
4. Deploy. Every push to `main` will trigger a new deployment automatically —
   ideal for maintaining the project from a phone via GitHub's mobile app or
   web UI.

### 3.3 Manual deploy (alternative)
```bash
cd apps/web
npm run build
wrangler pages deploy dist --project-name kyzen-web
```

### 3.4 Custom domain
In the Pages project settings, add a custom domain (e.g. `kyzen.dev` and
`www.kyzen.dev`) under **Custom domains**.

---

## 4. Local development

Run both apps side by side:

```bash
# Terminal 1 — API
cd workers/api
wrangler dev

# Terminal 2 — Website
cd apps/web
npm run dev
```

By default `wrangler dev` runs on `http://localhost:8787`. For local testing,
temporarily set `API_BASE_URL` in `packages/shared/src/constants.ts` to
`http://localhost:8787`.

---

## 5. Environment summary

| Variable                    | Where             | Required | Purpose                              |
|------------------------------|-------------------|----------|----------------------------------------|
| `RATE_LIMIT_KV`              | KV namespace       | Yes      | Rate limiting counters                  |
| `SHORTURL_KV`                | KV namespace       | Yes      | URL shortener storage                   |
| `RATE_LIMIT_MAX`             | `wrangler.toml`    | No       | Requests per window (default 60)        |
| `RATE_LIMIT_WINDOW_SECONDS`  | `wrangler.toml`    | No       | Window length in seconds (default 60)   |
| `AI_API_KEY`                 | Secret             | No       | Enables real `/api/ai/*` responses      |
| `OPENWEATHER_API_KEY`        | Secret             | No       | Alternative weather provider            |
| `EXCHANGE_RATE_API_KEY`      | Secret             | No       | Keyed currency provider                 |
