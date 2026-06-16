import { z } from "@hono/zod-openapi";

/**
 * Wraps a result schema in the standard Kyzen success envelope:
 * { success: true, creator: "Kyzen API", result: {...} }
 */
export function successSchema<T extends z.ZodTypeAny>(resultSchema: T) {
  return z.object({
    success: z.literal(true).openapi({ example: true }),
    creator: z.literal("Kyzen API").openapi({ example: "Kyzen API" }),
    result: resultSchema,
  });
}

/**
 * Standard Kyzen error envelope:
 * { success: false, creator: "Kyzen API", message: "..." }
 */
export const errorSchema = z.object({
  success: z.literal(false).openapi({ example: false }),
  creator: z.literal("Kyzen API").openapi({ example: "Kyzen API" }),
  message: z.string().openapi({ example: "Something went wrong on our end." }),
});

/** Standard set of error responses attached to every documented route. */
export const standardErrorResponses = {
  400: {
    description: "Invalid request parameters",
    content: { "application/json": { schema: errorSchema } },
  },
  429: {
    description: "Rate limit exceeded",
    content: { "application/json": { schema: errorSchema } },
  },
  500: {
    description: "Internal server error",
    content: { "application/json": { schema: errorSchema } },
  },
} as const;
