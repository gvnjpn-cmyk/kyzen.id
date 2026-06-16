import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types/env";
import { ok, fail } from "../lib/response";
import { successSchema, standardErrorResponses } from "../lib/openapiSchemas";
import { fetchWithRetry } from "../lib/fetchWithRetry";

export const toolsRoutes = new OpenAPIHono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /api/tools/qrcode
// ---------------------------------------------------------------------------
const qrcodeRoute = createRoute({
  method: "get",
  path: "/qrcode",
  tags: ["Tools"],
  summary: "Generate a QR code",
  description: "Generates a QR code image (PNG, base64 data URI) for any text or URL.",
  request: {
    query: z.object({
      text: z.string().min(1).max(2000).openapi({ example: "https://kyzen.dev", description: "Text or URL to encode." }),
      size: z.coerce.number().int().min(64).max(1024).optional().openapi({ example: 256, description: "Image size in pixels (default 256)." }),
    }),
  },
  responses: {
    200: {
      description: "QR code image",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              text: z.string(),
              size: z.number(),
              image: z.string().openapi({ description: "Base64 data URI of the generated PNG." }),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

toolsRoutes.openapi(qrcodeRoute, async (c) => {
  const { text, size = 256 } = c.req.valid("query");

  // Uses a public QR rendering service with retry. For full independence
  // from third parties, swap this for a self-contained QR encoding library.
  const upstream = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;

  const response = await fetchWithRetry(upstream, {}, { retries: 3 });
  if (!response.ok) {
    return fail(c, "Failed to generate QR code.", 502);
  }

  const buffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  return ok(c, {
    text,
    size,
    image: `data:image/png;base64,${base64}`,
  });
});

// ---------------------------------------------------------------------------
// GET /api/tools/shorturl
// ---------------------------------------------------------------------------
const shortUrlRoute = createRoute({
  method: "get",
  path: "/shorturl",
  tags: ["Tools"],
  summary: "Shorten a URL",
  description: "Creates a short code that maps to the given URL. Stored in Workers KV.",
  request: {
    query: z.object({
      url: z.string().url().openapi({ example: "https://example.com/very/long/path", description: "The destination URL." }),
    }),
  },
  responses: {
    200: {
      description: "Short URL created",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              original: z.string(),
              code: z.string(),
              short: z.string(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

toolsRoutes.openapi(shortUrlRoute, async (c) => {
  const { url } = c.req.valid("query");

  if (!c.env.SHORTURL_KV) {
    return fail(c, "URL shortener storage is not configured.", 500);
  }

  const code = generateCode(6);
  await c.env.SHORTURL_KV.put(`shorturl:${code}`, url);

  return ok(c, {
    original: url,
    code,
    short: `https://kyz.sh/${code}`,
  });
});

// ---------------------------------------------------------------------------
// GET /api/tools/password
// ---------------------------------------------------------------------------
const passwordRoute = createRoute({
  method: "get",
  path: "/password",
  tags: ["Tools"],
  summary: "Generate a random password",
  description: "Generates a cryptographically random password.",
  request: {
    query: z.object({
      length: z.coerce.number().int().min(4).max(128).optional().openapi({ example: 16, description: "Password length (default 16)." }),
      symbols: z.coerce.boolean().optional().openapi({ example: true, description: "Include special characters (default true)." }),
    }),
  },
  responses: {
    200: {
      description: "Generated password",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              password: z.string(),
              length: z.number(),
              symbols: z.boolean(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

toolsRoutes.openapi(passwordRoute, async (c) => {
  const { length = 16, symbols = true } = c.req.valid("query");

  const password = generatePassword(length, symbols);

  return ok(c, { password, length, symbols });
});

// ---------------------------------------------------------------------------
// GET /api/tools/uuid
// ---------------------------------------------------------------------------
const uuidRoute = createRoute({
  method: "get",
  path: "/uuid",
  tags: ["Tools"],
  summary: "Generate UUIDs",
  description: "Generates one or more random UUID v4 values.",
  request: {
    query: z.object({
      count: z.coerce.number().int().min(1).max(50).optional().openapi({ example: 1, description: "Number of UUIDs to generate (default 1, max 50)." }),
    }),
  },
  responses: {
    200: {
      description: "Generated UUIDs",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              uuids: z.array(z.string()),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

toolsRoutes.openapi(uuidRoute, async (c) => {
  const { count = 1 } = c.req.valid("query");

  const uuids = Array.from({ length: count }, () => crypto.randomUUID());

  return ok(c, { uuids });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function generateCode(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function generatePassword(length: number, symbols: boolean): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}";
  const charset = symbols ? letters + digits + special : letters + digits;

  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
}
