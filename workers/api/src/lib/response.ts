import type { Context } from "hono";

export const CREATOR = "Kyzen API" as const;

/**
 * Sends the standard Kyzen success envelope:
 * { success: true, creator: "Kyzen API", result: {...} }
 */
export function ok<T>(c: Context, result: T, status: 200 | 201 = 200) {
  return c.json(
    {
      success: true as const,
      creator: CREATOR,
      result,
    },
    status
  );
}

/**
 * Sends the standard Kyzen error envelope:
 * { success: false, creator: "Kyzen API", message: "..." }
 */
export function fail(
  c: Context,
  message: string,
  status: 400 | 401 | 403 | 404 | 429 | 500 | 502 = 400
) {
  return c.json(
    {
      success: false as const,
      creator: CREATOR,
      message,
    },
    status
  );
}
