import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types/env";
import { ok } from "../lib/response";
import { successSchema, standardErrorResponses } from "../lib/openapiSchemas";
import { fetchWithRetry } from "../lib/fetchWithRetry";

export const funRoutes = new OpenAPIHono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /api/fun/animequote
// ---------------------------------------------------------------------------
const animeQuoteRoute = createRoute({
  method: "get",
  path: "/animequote",
  tags: ["Fun"],
  summary: "Random anime quote",
  description: "Returns a random anime quote with character and anime name.",
  responses: {
    200: {
      description: "Random anime quote",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              quote: z.string(),
              character: z.string(),
              anime: z.string(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

funRoutes.openapi(animeQuoteRoute, async (c) => {
  try {
    const response = await fetchWithRetry("https://animechan.io/api/v1/quotes/random", {}, { retries: 2, timeoutMs: 3000 });
    if (response.ok) {
      const data = await response.json<{ data?: { content: string; character?: { name?: string }; anime?: { name?: string } } }>();
      const item = data.data;
      if (item) {
        return ok(c, {
          quote: item.content,
          character: item.character?.name ?? "Unknown",
          anime: item.anime?.name ?? "Unknown",
        });
      }
    }
  } catch {
    // fall through to local fallback below
  }

  const fallback = pickRandom(ANIME_QUOTES);
  return ok(c, fallback);
});

// ---------------------------------------------------------------------------
// GET /api/fun/facts
// ---------------------------------------------------------------------------
const factsRoute = createRoute({
  method: "get",
  path: "/facts",
  tags: ["Fun"],
  summary: "Random fact",
  description: "Returns a random interesting fact.",
  responses: {
    200: {
      description: "Random fact",
      content: {
        "application/json": {
          schema: successSchema(z.object({ fact: z.string() })),
        },
      },
    },
    ...standardErrorResponses,
  },
});

funRoutes.openapi(factsRoute, async (c) => {
  try {
    const response = await fetchWithRetry("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en", {}, { retries: 2, timeoutMs: 3000 });
    if (response.ok) {
      const data = await response.json<{ text?: string }>();
      if (data.text) return ok(c, { fact: data.text });
    }
  } catch {
    // fall through to local fallback below
  }

  return ok(c, { fact: pickRandom(FALLBACK_FACTS) });
});

// ---------------------------------------------------------------------------
// GET /api/fun/jokes
// ---------------------------------------------------------------------------
const jokesRoute = createRoute({
  method: "get",
  path: "/jokes",
  tags: ["Fun"],
  summary: "Random joke",
  description: "Returns a random short joke.",
  responses: {
    200: {
      description: "Random joke",
      content: {
        "application/json": {
          schema: successSchema(z.object({ joke: z.string() })),
        },
      },
    },
    ...standardErrorResponses,
  },
});

funRoutes.openapi(jokesRoute, async (c) => {
  try {
    const response = await fetchWithRetry("https://v2.jokeapi.dev/joke/Programming,Pun?type=single", {}, { retries: 2, timeoutMs: 3000 });
    if (response.ok) {
      const data = await response.json<{ joke?: string; error?: boolean }>();
      if (!data.error && data.joke) return ok(c, { joke: data.joke });
    }
  } catch {
    // fall through to local fallback below
  }

  return ok(c, { joke: pickRandom(FALLBACK_JOKES) });
});

// ---------------------------------------------------------------------------
// Local fallback data
// Used when the upstream service is unavailable, so these endpoints never
// return a hard error to the caller.
// ---------------------------------------------------------------------------
const ANIME_QUOTES = [
  { quote: "Believe in yourself, not in the you who believes in me. Believe in the me who believes in you!", character: "Kamina", anime: "Gurren Lagann" },
  { quote: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" },
  { quote: "Hard work is worthless for those that don't believe in themselves.", character: "Naruto Uzumaki", anime: "Naruto" },
];

const FALLBACK_FACTS = [
  "Honey never spoils if stored properly.",
  "Octopuses have three hearts.",
  "Bananas are berries, but strawberries aren't.",
];

const FALLBACK_JOKES = [
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "There are 10 types of people: those who understand binary and those who don't.",
  "I told my computer I needed a break, and it said 'No problem, I'll go to sleep.'",
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
