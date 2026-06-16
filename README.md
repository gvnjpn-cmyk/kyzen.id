# Kyzen API

**Simple. Fast. Reliable.**

A small, fast, reliable REST API platform for developers, bot creators, and
hobby projects — designed to be maintained by one person, even from a phone.

```
GET /api/fun/jokes

{
  "success": true,
  "creator": "Kyzen API",
  "result": {
    "joke": "Why do programmers prefer dark mode? Because light attracts bugs."
  }
}
```

## What's inside

| Path                | Description                                              |
|---------------------|-------------------------------------------------------------|
| `apps/web`          | Astro + Tailwind website (landing, docs, playground, status, about) |
| `workers/api`       | Hono backend on Cloudflare Workers, with OpenAPI docs    |
| `packages/shared`   | Shared types + the single source of truth for all endpoints |
| `docs/`             | Architecture, deployment, and roadmap documentation       |

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full design, and
[`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) to ship it.

## Endpoints

| Category | Endpoints |
|----------|-----------|
| **AI**      | `GET /api/ai/chat`, `GET /api/ai/prompt`, `GET /api/ai/summarize` |
| **Tools**   | `GET /api/tools/qrcode`, `GET /api/tools/shorturl`, `GET /api/tools/password`, `GET /api/tools/uuid` |
| **Utility** | `GET /api/utility/weather`, `GET /api/utility/ip`, `GET /api/utility/currency` |
| **Fun**     | `GET /api/fun/animequote`, `GET /api/fun/facts`, `GET /api/fun/jokes` |
| **Image**   | `GET /api/image/quote`, `GET /api/image/profile` |

Every response follows one of two shapes:

```jsonc
// Success
{ "success": true, "creator": "Kyzen API", "result": { /* ... */ } }

// Error
{ "success": false, "creator": "Kyzen API", "message": "..." }
```

## Quick start

```bash
npm install

# Run the API locally (http://localhost:8787)
cd workers/api && wrangler dev

# Run the website locally (http://localhost:4321)
cd apps/web && npm run dev
```

## Documentation

- **Live docs page**: `/docs` on the website (human-friendly, generated from
  `packages/shared`)
- **OpenAPI / Swagger UI**: `/docs` on the API worker
- **OpenAPI JSON**: `/openapi.json` on the API worker

## Roadmaps

- [`docs/MVP_ROADMAP.md`](./docs/MVP_ROADMAP.md) — what's needed to ship v1
- [`docs/PRODUCTION_ROADMAP.md`](./docs/PRODUCTION_ROADMAP.md) — optional
  hardening for later
