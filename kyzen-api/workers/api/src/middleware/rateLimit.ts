import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/env";
import { fail } from "../lib/response";

/**
 * Simple fixed-window rate limiter using Workers KV.
 *
 * Each client (identified by `CF-Connecting-IP`) gets `RATE_LIMIT_MAX`
 * requests per `RATE_LIMIT_WINDOW_SECONDS`. This is intentionally simple
 * (a fixed window rather than a sliding one) to keep KV reads/writes low
 * for a personal-scale API. For stricter limits at higher scale, swap the
 * KV-backed counter for a Durable Object.
 */
export const rateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const max = Number(c.env.RATE_LIMIT_MAX ?? "60");
  const windowSeconds = Number(c.env.RATE_LIMIT_WINDOW_SECONDS ?? "60");

  // If KV isn't bound (e.g. local dev without --kv), skip rate limiting.
  if (!c.env.RATE_LIMIT_KV) {
    await next();
    return;
  }

  const windowKey = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `ratelimit:${ip}:${windowKey}`;

  const current = await c.env.RATE_LIMIT_KV.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= max) {
    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", "0");
    return fail(c, "Rate limit exceeded. Please slow down and try again shortly.", 429);
  }

  await c.env.RATE_LIMIT_KV.put(key, String(count + 1), {
    expirationTtl: windowSeconds * 2,
  });

  c.header("X-RateLimit-Limit", String(max));
  c.header("X-RateLimit-Remaining", String(Math.max(0, max - count - 1)));

  await next();
};
