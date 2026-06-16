import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types/env";
import { ok } from "../lib/response";
import { successSchema, standardErrorResponses } from "../lib/openapiSchemas";
import { ENDPOINTS } from "@kyzen/shared";

export const statusRoutes = new OpenAPIHono<AppEnv>();

// The worker's start time, used to report an approximate uptime for this
// specific isolate. Cloudflare Workers don't have a persistent "server",
// so this reflects the lifetime of the current isolate instance, not the
// historical uptime of the platform as a whole (see the status page for
// the broader picture, which can be backed by an external uptime monitor).
const BOOT_TIME = Date.now();

const statusRoute = createRoute({
  method: "get",
  path: "/status",
  tags: ["Status"],
  summary: "API status",
  description: "Returns the current health of the API, the number of available endpoints, and isolate uptime.",
  responses: {
    200: {
      description: "API status",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              status: z.literal("operational"),
              totalEndpoints: z.number(),
              uptimeSeconds: z.number(),
              timestamp: z.string(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

statusRoutes.openapi(statusRoute, async (c) => {
  return ok(c, {
    status: "operational" as const,
    totalEndpoints: ENDPOINTS.length,
    uptimeSeconds: Math.floor((Date.now() - BOOT_TIME) / 1000),
    timestamp: new Date().toISOString(),
  });
});
