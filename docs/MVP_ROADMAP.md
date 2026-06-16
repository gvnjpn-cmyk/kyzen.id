# MVP Roadmap

The goal of the MVP is a deployed, working version of everything described in
the brief — small enough to be built and maintained by one person.

## Phase 0 — Project setup
- [x] Monorepo structure (`apps/`, `workers/`, `packages/`, `docs/`)
- [x] Shared types + endpoint registry (`packages/shared`)
- [x] Tailwind design tokens matching the brand (background, primary, text)

## Phase 1 — Backend core
- [x] Hono app on Cloudflare Workers with `@hono/zod-openapi`
- [x] Standard response envelope (`ok` / `fail` helpers)
- [x] Global middleware: request ID, logger, CORS, rate limiting
- [x] Centralized error handling (`onError`, `notFound`)
- [x] `/api/status` endpoint

## Phase 2 — Endpoints
- [x] **AI**: `/chat`, `/prompt`, `/summarize` (stubbed, ready for a real
  provider)
- [x] **Tools**: `/qrcode`, `/shorturl`, `/password`, `/uuid`
- [x] **Utility**: `/weather`, `/ip`, `/currency`
- [x] **Fun**: `/animequote`, `/facts`, `/jokes` (with local fallbacks)
- [x] **Image**: `/quote`, `/profile` (SVG, self-contained)

## Phase 3 — Documentation
- [x] OpenAPI spec generated automatically at `/openapi.json`
- [x] Swagger UI at `/docs`
- [x] `/docs` page on the website, generated from the shared endpoint registry

## Phase 4 — Website
- [x] Landing page (hero, features, categories, CTA)
- [x] Documentation page
- [x] Playground (select endpoint, fill params, execute, copy response)
- [x] Status page (live `/api/status` check + endpoint counts)
- [x] About page

## Phase 5 — Deploy
- [ ] Create `RATE_LIMIT_KV` and `SHORTURL_KV` namespaces, update `wrangler.toml`
- [ ] `wrangler deploy` the API worker
- [ ] Connect `apps/web` to Cloudflare Pages
- [ ] Point `/playground` and `/status` at the deployed API URL
- [ ] Verify all 15 endpoints from the deployed playground

Once Phase 5 is complete, Kyzen API is "done" in the sense that it satisfies
every requirement in the brief and can be safely used day-to-day. Everything
in `PRODUCTION_ROADMAP.md` is optional hardening for when (and if) it's needed.
