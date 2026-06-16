import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AppEnv } from "../types/env";
import { ok, fail } from "../lib/response";
import { successSchema, errorSchema, standardErrorResponses } from "../lib/openapiSchemas";
import { fetchWithRetry } from "../lib/fetchWithRetry";

export const utilityRoutes = new OpenAPIHono<AppEnv>();

// ---------------------------------------------------------------------------
// GET /api/utility/weather
// ---------------------------------------------------------------------------
const weatherRoute = createRoute({
  method: "get",
  path: "/weather",
  tags: ["Utility"],
  summary: "Get current weather for a city",
  description: "Returns current weather conditions for the given city using Open-Meteo (no API key required).",
  request: {
    query: z.object({
      city: z.string().min(1).max(100).openapi({ example: "Tokyo", description: "City name." }),
    }),
  },
  responses: {
    200: {
      description: "Current weather conditions",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              city: z.string(),
              temperature: z.number(),
              windSpeed: z.number(),
              condition: z.string(),
            })
          ),
        },
      },
    },
    404: {
      description: "City not found",
      content: { "application/json": { schema: errorSchema } },
    },
    ...standardErrorResponses,
  },
});

utilityRoutes.openapi(weatherRoute, async (c) => {
  const { city } = c.req.valid("query");

  // Step 1: geocode the city name to coordinates.
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const geoRes = await fetchWithRetry(geoUrl, {}, { retries: 3 });
  if (!geoRes.ok) return fail(c, "Failed to look up city location.", 502);

  const geoData = await geoRes.json<{ results?: { latitude: number; longitude: number; name: string }[] }>();
  const location = geoData.results?.[0];
  if (!location) return fail(c, `City "${city}" was not found.`, 404);

  // Step 2: fetch current weather for those coordinates.
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`;
  const weatherRes = await fetchWithRetry(weatherUrl, {}, { retries: 3 });
  if (!weatherRes.ok) return fail(c, "Failed to fetch weather data.", 502);

  const weatherData = await weatherRes.json<{
    current_weather: { temperature: number; windspeed: number; weathercode: number };
  }>();

  return ok(c, {
    city: location.name,
    temperature: weatherData.current_weather.temperature,
    windSpeed: weatherData.current_weather.windspeed,
    condition: describeWeatherCode(weatherData.current_weather.weathercode),
  });
});

// ---------------------------------------------------------------------------
// GET /api/utility/ip
// ---------------------------------------------------------------------------
const ipRoute = createRoute({
  method: "get",
  path: "/ip",
  tags: ["Utility"],
  summary: "Look up IP address info",
  description: "Returns geo and network information for the caller's IP, or a provided IP.",
  request: {
    query: z.object({
      ip: z.string().optional().openapi({ example: "8.8.8.8", description: "IP address to look up (defaults to the caller's IP)." }),
    }),
  },
  responses: {
    200: {
      description: "IP information",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              ip: z.string(),
              country: z.string().optional(),
              region: z.string().optional(),
              city: z.string().optional(),
              timezone: z.string().optional(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

utilityRoutes.openapi(ipRoute, async (c) => {
  const { ip: queryIp } = c.req.valid("query");
  const callerIp = c.req.header("CF-Connecting-IP") ?? "0.0.0.0";
  const ip = queryIp ?? callerIp;

  // Cloudflare exposes rich geo data for the *caller's* IP directly via
  // request.cf, with zero outbound requests. For a *looked-up* IP we fall
  // back to a third-party lookup with retry.
  if (!queryIp) {
    const cf = (c.req.raw as any).cf as
      | { country?: string; region?: string; city?: string; timezone?: string }
      | undefined;

    return ok(c, {
      ip,
      country: cf?.country,
      region: cf?.region,
      city: cf?.city,
      timezone: cf?.timezone,
    });
  }

  const response = await fetchWithRetry(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {}, { retries: 3 });
  if (!response.ok) return fail(c, "Failed to look up IP address.", 502);

  const data = await response.json<{
    ip: string;
    country_name?: string;
    region?: string;
    city?: string;
    timezone?: string;
    error?: boolean;
    reason?: string;
  }>();

  if (data.error) return fail(c, data.reason ?? "Invalid IP address.", 400);

  return ok(c, {
    ip: data.ip,
    country: data.country_name,
    region: data.region,
    city: data.city,
    timezone: data.timezone,
  });
});

// ---------------------------------------------------------------------------
// GET /api/utility/currency
// ---------------------------------------------------------------------------
const currencyRoute = createRoute({
  method: "get",
  path: "/currency",
  tags: ["Utility"],
  summary: "Convert currency",
  description: "Converts an amount from one currency to another using live exchange rates.",
  request: {
    query: z.object({
      from: z.string().length(3).openapi({ example: "USD", description: "Source currency code (ISO 4217)." }),
      to: z.string().length(3).openapi({ example: "EUR", description: "Target currency code (ISO 4217)." }),
      amount: z.coerce.number().positive().openapi({ example: 100, description: "Amount to convert." }),
    }),
  },
  responses: {
    200: {
      description: "Converted amount",
      content: {
        "application/json": {
          schema: successSchema(
            z.object({
              from: z.string(),
              to: z.string(),
              amount: z.number(),
              rate: z.number(),
              converted: z.number(),
            })
          ),
        },
      },
    },
    ...standardErrorResponses,
  },
});

utilityRoutes.openapi(currencyRoute, async (c) => {
  const { from, to, amount } = c.req.valid("query");

  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  // Uses a free exchange-rate API. Swap for a keyed provider via
  // c.env.EXCHANGE_RATE_API_KEY for higher reliability / rate limits.
  const url = `https://open.er-api.com/v6/latest/${fromCode}`;
  const response = await fetchWithRetry(url, {}, { retries: 3 });
  if (!response.ok) return fail(c, "Failed to fetch exchange rates.", 502);

  const data = await response.json<{ rates?: Record<string, number>; result?: string }>();
  const rate = data.rates?.[toCode];

  if (!rate) return fail(c, `Unsupported currency pair: ${fromCode} -> ${toCode}.`, 400);

  return ok(c, {
    from: fromCode,
    to: toCode,
    amount,
    rate,
    converted: Math.round(amount * rate * 100) / 100,
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function describeWeatherCode(code: number): string {
  if (code === 0) return "Clear";
  if ([1, 2, 3].includes(code)) return "Partly Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}
