import type { Context } from "hono";
import { fail } from "../lib/response";
import { UpstreamError } from "../lib/fetchWithRetry";
import { ZodError } from "zod";

/**
 * Global error handler, registered via `app.onError()` in src/index.ts.
 * Converts any thrown error into the standard Kyzen error envelope.
 */
export function handleError(err: Error, c: Context) {
  console.error(
    JSON.stringify({
      tag: "kyzen-error",
      path: c.req.path,
      name: err.name,
      message: err.message,
    })
  );

  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    return fail(c, `Invalid request: ${message}`, 400);
  }

  if (err instanceof UpstreamError) {
    return fail(c, "A connected service is currently unavailable. Please try again shortly.", 502);
  }

  return fail(c, "Something went wrong on our end.", 500);
}

/**
 * 404 handler, registered via `app.notFound()`.
 */
export function handleNotFound(c: Context) {
  return fail(c, `Route not found: ${c.req.method} ${c.req.path}`, 404);
}
