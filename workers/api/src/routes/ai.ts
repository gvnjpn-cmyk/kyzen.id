import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types/env";
import { ok, fail } from "../lib/response";
import { successSchema, standardErrorResponses } from "../lib/openapiSchemas";

export const aiRoutes = new OpenAPIHono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /api/ai/chat
// ---------------------------------------------------------------------------
const chatRoute = createRoute({
  method: "get",
  path: "/chat",
  tags: ["AI"],
  summary: "Chat with the Kyzen AI assistant",
  description: "Sends a message to the Kyzen AI assistant and returns a conversational reply.",
  request: {
    query: z.object({
      text: z.string().min(1).max(2000).openapi({
        example: "Hello, who are you?",
        description: "The message to send to the assistant.",
      }),
    }),
  },
  responses: {
    200: {
      description: "Assistant reply",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              prompt: z.string(),
              reply: z.string(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

aiRoutes.openapi(chatRoute, async (c) => {
  const { text } = c.req.valid("query");

  // NOTE: Replace this stub with a call to your preferred LLM provider.
  // Wrap the outbound call with `fetchWithRetry` from "../lib/fetchWithRetry"
  // for automatic retries on transient failures.
  const reply = `You said: "${text}". (Connect an AI provider in src/routes/ai.ts to make this dynamic.)`;

  return ok(c, { prompt: text, reply });
});

// ---------------------------------------------------------------------------
// GET /api/ai/prompt
// ---------------------------------------------------------------------------
const promptRoute = createRoute({
  method: "get",
  path: "/prompt",
  tags: ["AI"],
  summary: "Generate a freeform text completion",
  description: "Generates a short text completion for a custom prompt.",
  request: {
    query: z.object({
      text: z.string().min(1).max(2000).openapi({
        example: "Write a tagline for a coffee shop",
        description: "The prompt to complete.",
      }),
    }),
  },
  responses: {
    200: {
      description: "Generated completion",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              prompt: z.string(),
              completion: z.string(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

aiRoutes.openapi(promptRoute, async (c) => {
  const { text } = c.req.valid("query");

  // NOTE: Replace with a real generation call. Keep responses short and
  // cache common prompts in KV if you expect repeated requests.
  const completion = `Generated response for: "${text}"`;

  return ok(c, { prompt: text, completion });
});

// ---------------------------------------------------------------------------
// GET /api/ai/summarize
// ---------------------------------------------------------------------------
const summarizeRoute = createRoute({
  method: "get",
  path: "/summarize",
  tags: ["AI"],
  summary: "Summarize text",
  description: "Summarizes a block of text into a short summary.",
  request: {
    query: z.object({
      text: z.string().min(1).max(8000).openapi({
        example: "A long article about renewable energy...",
        description: "The text to summarize.",
      }),
    }),
  },
  responses: {
    200: {
      description: "Generated summary",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              summary: z.string(),
              originalLength: z.number(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

aiRoutes.openapi(summarizeRoute, async (c) => {
  const { text } = c.req.valid("query");

  if (text.trim().length === 0) {
    return fail(c, "The 'text' parameter cannot be empty.", 400);
  }

  // NOTE: Replace with a real summarization call.
  const summary = text.length > 160 ? `${text.slice(0, 157)}...` : text;

  return ok(c, { summary, originalLength: text.length });
});
