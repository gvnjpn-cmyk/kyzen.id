import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types/env";
import { ok } from "../lib/response";
import { successSchema, standardErrorResponses } from "../lib/openapiSchemas";
import { renderQuoteSvg, renderProfileCardSvg, svgToDataUri } from "../lib/svgImage";

export const imageRoutes = new OpenAPIHono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /api/image/quote
// ---------------------------------------------------------------------------
const quoteImageRoute = createRoute({
  method: "get",
  path: "/quote",
  tags: ["Image"],
  summary: "Generate a quote image card",
  description: "Renders an SVG image card containing a quote and optional author.",
  request: {
    query: z.object({
      text: z.string().min(1).max(280).openapi({ example: "Simple. Fast. Reliable.", description: "Quote text to render." }),
      author: z.string().max(60).optional().openapi({ example: "Kyzen API", description: "Author name shown under the quote." }),
    }),
  },
  responses: {
    200: {
      description: "Generated quote image",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              text: z.string(),
              author: z.string().optional(),
              image: z.string().openapi({ description: "Base64 data URI of the generated SVG." }),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

imageRoutes.openapi(quoteImageRoute, async (c) => {
  const { text, author } = c.req.valid("query");

  const svg = renderQuoteSvg({ text, author });

  return ok(c, {
    text,
    author,
    image: svgToDataUri(svg),
  });
});

// ---------------------------------------------------------------------------
// GET /api/image/profile
// ---------------------------------------------------------------------------
const profileImageRoute = createRoute({
  method: "get",
  path: "/profile",
  tags: ["Image"],
  summary: "Generate a profile card image",
  description: "Renders a minimal SVG profile card from a name and role.",
  request: {
    query: z.object({
      name: z.string().min(1).max(60).openapi({ example: "Ada Lovelace", description: "Name to display." }),
      role: z.string().max(60).optional().openapi({ example: "Software Pioneer", description: "Role or title to display." }),
    }),
  },
  responses: {
    200: {
      description: "Generated profile card image",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              name: z.string(),
              role: z.string().optional(),
              image: z.string().openapi({ description: "Base64 data URI of the generated SVG." }),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

imageRoutes.openapi(profileImageRoute, async (c) => {
  const { name, role } = c.req.valid("query");

  const svg = renderProfileCardSvg({ name, role });

  return ok(c, {
    name,
    role,
    image: svgToDataUri(svg),
  });
});
