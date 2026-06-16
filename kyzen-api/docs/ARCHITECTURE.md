# Kyzen API — Architecture

> Simple. Fast. Reliable.

This document describes the overall architecture of Kyzen API: how the project is
organized, how the backend and frontend are structured, what infrastructure it
relies on, and the design system used across the website.

---

## 1. High-level overview

Kyzen API is a small monorepo with three kinds of packages:

- **`workers/api`** — the REST API itself, built with [Hono](https://hono.dev) and
  deployed as a single Cloudflare Worker.
- **`apps/web`** — the marketing/docs/playground website, built with Astro +
  Tailwind CSS and deployed to Cloudflare Pages.
- **`packages/shared`** — a small TypeScript package containing types and the
  endpoint registry shared by both the API and the website, so documentation,
  the playground, and the status page never drift out of sync with the API.

```
                    ┌─────────────────────────┐
                    │   packages/shared        │
                    │   (types + endpoint      │
                    │    registry, single      │
                    │    source of truth)       │
                    └────────────┬─────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                         │
   ┌──────────▼──────────┐                  ┌──────────▼──────────┐
   │  workers/api          │   HTTPS / JSON   │  apps/web            │
   │  Hono on Cloudflare   │ ◄──────────────► │  Astro on Cloudflare │
   │  Workers               │                  │  Pages                │
   └────────────────────────┘                  └───────────────────────┘
```

---

## 2. Folder structure

```
kyzen-api/
├── apps/
│   └── web/                     # Astro + Tailwind frontend
│       ├── public/              # Static assets (favicon, etc.)
│       ├── src/
│       │   ├── components/      # Header, Footer, Hero, CodeBlock, ...
│       │   ├── layouts/          # Shared page layout
│       │   ├── lib/              # Small client-side helpers (JSON highlighter)
│       │   ├── pages/            # index, docs, playground, status, about
│       │   └── styles/           # Tailwind entry + design tokens
│       ├── astro.config.mjs
│       ├── tailwind.config.cjs
│       └── package.json
│
├── workers/
│   └── api/                     # Hono backend (Cloudflare Worker)
│       ├── src/
│       │   ├── routes/          # ai, tools, utility, fun, image, status
│       │   ├── middleware/       # logger, rateLimit, errorHandler
│       │   ├── lib/              # response helpers, retry, svg, openapi schemas
│       │   ├── types/            # Bindings / Env types
│       │   └── index.ts          # App entrypoint, route mounting, OpenAPI doc
│       ├── wrangler.toml
│       └── package.json
│
├── packages/
│   └── shared/                  # Shared types + endpoint registry
│       └── src/
│           ├── types.ts
│           ├── constants.ts
│           └── index.ts
│
├── docs/                         # Project-level documentation (this folder)
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── MVP_ROADMAP.md
│   └── PRODUCTION_ROADMAP.md
│
├── package.json                  # Workspace root
└── pnpm-workspace.yaml
```

This mirrors the structure requested in the brief (`apps/`, `packages/`, `workers/`,
`docs/`) while keeping everything small enough for one person to navigate quickly.

---

## 3. Backend architecture (`workers/api`)

### 3.1 Request lifecycle

```
Incoming request
   │
   ▼
requestId middleware  ──────► attaches a UUID for log correlation
   │
   ▼
requestLogger          ──────► logs method, path, status, duration as JSON
   │
   ▼
cors                    ──────► allows cross-origin requests from the website / bots
   │
   ▼
rateLimit (/api/*)      ──────► per-IP fixed-window limiter backed by Workers KV
   │
   ▼
Route handler           ──────► validated with Zod, returns { success, creator, ... }
   │
   ▼
onError / notFound       ──────► converts thrown errors into the standard envelope
```

### 3.2 Route modules

Each category from the brief maps to one route module under `src/routes/`:

| Module          | Mounted at         | Endpoints                                                   |
|------------------|--------------------|--------------------------------------------------------------|
| `ai.ts`          | `/api/ai`          | `/chat`, `/prompt`, `/summarize`                              |
| `tools.ts`       | `/api/tools`       | `/qrcode`, `/shorturl`, `/password`, `/uuid`                  |
| `utility.ts`     | `/api/utility`     | `/weather`, `/ip`, `/currency`                                |
| `fun.ts`         | `/api/fun`         | `/animequote`, `/facts`, `/jokes`                              |
| `image.ts`       | `/api/image`       | `/quote`, `/profile`                                          |
| `status.ts`      | `/api`             | `/status`                                                      |

Every route is defined with `@hono/zod-openapi`'s `createRoute`, which means:

- Request parameters are validated automatically (bad input → `400` with a
  descriptive message).
- The OpenAPI document at `/openapi.json` is generated **directly from the
  route definitions** — there is no separate spec to maintain by hand.
- Swagger UI is served at `/docs`.

### 3.3 Response envelope

Two helper functions in `src/lib/response.ts` guarantee every response matches
the brief's standard:

```ts
ok(c, result)              // { success: true,  creator: "Kyzen API", result }
fail(c, message, status)   // { success: false, creator: "Kyzen API", message }
```

### 3.4 Resilience

- **`fetchWithRetry`** (`src/lib/fetchWithRetry.ts`) wraps every outbound call
  to a third-party API (weather, currency, jokes, facts, anime quotes, QR
  rendering) with up to 3 attempts, exponential backoff, and a per-attempt
  timeout. 5xx responses are retried; 4xx responses are not.
- **Fallback data**: the `fun` routes ship with small local fallback arrays so
  `/api/fun/*` always returns a valid response even if every upstream is down.
- **Image generation** (`/api/image/*`) is fully self-contained — SVGs are
  generated in-worker, with zero external dependencies.

### 3.5 Middleware

- **`requestLogger`** — structured JSON logs for `wrangler tail` / Logpush.
- **`rateLimit`** — fixed-window limiter per `CF-Connecting-IP`, configurable
  via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_SECONDS` in `wrangler.toml`.
- **`cors`** — `hono/cors`, open by default (`origin: "*"`) since this is a
  public, keyless API.
- **`errorHandler`** — converts `ZodError`, `UpstreamError`, and any other
  thrown error into the standard error envelope.

---

## 4. Frontend architecture (`apps/web`)

### 4.1 Pages

| Route          | Purpose                                                              |
|-----------------|-----------------------------------------------------------------------|
| `/`             | Landing page — hero, features, endpoint categories, CTA               |
| `/docs`         | Full reference, generated from `packages/shared`'s endpoint registry  |
| `/playground`   | Interactive request builder + response viewer                          |
| `/status`       | Live health check against `/api/status`                                |
| `/about`        | Project philosophy, principles, response standard                      |

### 4.2 Components

- `Header.astro` / `Footer.astro` — site-wide navigation and footer (footer
  lists every endpoint by category, as specified in the brief).
- `Hero.astro` — the landing page's signature element: a terminal-style card
  showing a real `GET /api/fun/jokes` request/response pair.
- `Features.astro`, `EndpointCategories.astro` — landing page sections.
- `CodeBlock.astro` + `lib/highlightJson.ts` — minimal JSON syntax highlighting
  without pulling in a full highlighting library.

### 4.3 Data flow

`packages/shared/src/constants.ts` exports `ENDPOINTS`, a single array
describing every endpoint (method, path, category, description, parameters,
example response). The docs page, the footer, the landing page's category
section, and the playground's endpoint selector all read from this array —
add an endpoint once, and it appears everywhere.

### 4.4 Design system

| Token        | Value      | Usage                              |
|--------------|------------|--------------------------------------|
| `background` | `#0F172A`  | Page background                       |
| `surface`    | `#16213A`  | Cards, panels                          |
| `surface-2`  | `#1E293B`  | Code blocks, inputs, raised elements  |
| `border`     | `#243049`  | Borders, dividers                     |
| `primary`    | `#38BDF8`  | Links, buttons, accents                |
| `text`       | `#E2E8F0`  | Primary text                          |
| `muted`      | `#94A3B8`  | Secondary text                        |
| `success`    | `#4ADE80`  | Status indicators, "200 OK"            |

Typography:

- **Display** — Space Grotesk (headings, brand name) — geometric, modern, used
  with restraint.
- **Body** — Inter (paragraphs, UI copy).
- **Mono** — JetBrains Mono (endpoint paths, JSON, code).

Motion is intentionally minimal: a single subtle pulse on the hero's terminal
cursor, and standard hover/focus transitions. `prefers-reduced-motion` is
respected globally.

---

## 5. Database recommendation

Kyzen API is designed to need **as little persistent storage as possible**:

- **Workers KV** is sufficient for the current feature set:
  - `RATE_LIMIT_KV` — per-IP request counters (short TTL, self-expiring).
  - `SHORTURL_KV` — short code → original URL mappings for `/api/tools/shorturl`.
- **No relational database is required for the MVP.** All other endpoints are
  either stateless (UUID, password, image generation) or proxy a third-party
  API with retries and local fallbacks.

If the project grows to need accounts, API keys, usage analytics, or a
redirect table for `/api/tools/shorturl` with click tracking, the recommended
next step is **Cloudflare D1** (SQLite at the edge) — it integrates natively
with Workers, has a generous free tier, and avoids introducing an external
database service. This is covered in `PRODUCTION_ROADMAP.md`.

---

## 6. API structure summary

```
GET  /                      → API welcome message + links
GET  /docs                  → Swagger UI
GET  /openapi.json           → OpenAPI 3.0 specification

GET  /api/status             → status, uptime, total endpoints

GET  /api/ai/chat             ?text=
GET  /api/ai/prompt           ?text=
GET  /api/ai/summarize        ?text=

GET  /api/tools/qrcode        ?text=&size=
GET  /api/tools/shorturl       ?url=
GET  /api/tools/password       ?length=&symbols=
GET  /api/tools/uuid           ?count=

GET  /api/utility/weather      ?city=
GET  /api/utility/ip            ?ip=
GET  /api/utility/currency      ?from=&to=&amount=

GET  /api/fun/animequote
GET  /api/fun/facts
GET  /api/fun/jokes

GET  /api/image/quote          ?text=&author=
GET  /api/image/profile        ?name=&role=
```

All endpoints return the standard success/error envelope described in
`about.astro` and the project README.
