import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/env";

/**
 * Logs every request as a single structured line:
 *   [Kyzen] GET /api/fun/jokes 200 12ms
 *
 * In production these lines are picked up by `wrangler tail` and/or
 * Cloudflare's Logpush if enabled.
 */
export const requestLogger: MiddlewareHandler<AppEnv> = async (c, next) => {
  const start = Date.now();
  const { method } = c.req;
  const path = c.req.path;

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(
    JSON.stringify({
      tag: "kyzen-request",
      method,
      path,
      status,
      durationMs: duration,
      requestId: c.get("requestId"),
    })
  );
};
