import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import type { AppEnv } from "./types/env";
import { requestLogger } from "./middleware/logger";
import { rateLimit } from "./middleware/rateLimit";
import { handleError, handleNotFound } from "./middleware/errorHandler";
import { ok } from "./lib/response";

import { aiRoutes } from "./routes/ai";
import { toolsRoutes } from "./routes/tools";
import { utilityRoutes } from "./routes/utility";
import { funRoutes } from "./routes/fun";
import { imageRoutes } from "./routes/image";
import { statusRoutes } from "./routes/status";

const app = new OpenAPIHono<AppEnv>();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use("*", async (c, next) => {
  c.set("requestId", crypto.randomUUID());
  await next();
});

app.use("*", requestLogger);

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

app.use("/api/*", rateLimit);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/", (c) =>
  ok(c, {
    message: "Welcome to Kyzen API — Simple. Fast. Reliable.",
    docs: "/docs",
    openapi: "/openapi.json",
    status: "/api/status",
  })
);

app.route("/api/ai", aiRoutes);
app.route("/api/tools", toolsRoutes);
app.route("/api/utility", utilityRoutes);
app.route("/api/fun", funRoutes);
app.route("/api/image", imageRoutes);
app.route("/api", statusRoutes);

// ---------------------------------------------------------------------------
// OpenAPI documentation
// ---------------------------------------------------------------------------
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Kyzen API",
    version: "1.0.0",
    description:
      "Kyzen API is a small, fast, reliable REST API for developers, bot creators, and hobby projects. " +
      "Every response follows a consistent envelope: { success, creator, result } on success, " +
      "or { success, creator, message } on error.",
    contact: {
      name: "Kyzen API",
      url: "https://kyzen.dev",
    },
  },
  servers: [{ url: "https://api.kyzen.dev", description: "Production" }],
  tags: [
    { name: "AI", description: "Conversational and text-generation endpoints." },
    { name: "Tools", description: "Everyday developer utilities." },
    { name: "Utility", description: "Real-world data: weather, IP, currency." },
    { name: "Fun", description: "Quotes, facts, and jokes." },
    { name: "Image", description: "On-the-fly generated image cards." },
    { name: "Status", description: "Service health and metadata." },
  ],
});

app.get("/docs", swaggerUI({ url: "/openapi.json" }));

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.notFound(handleNotFound);
app.onError(handleError);

export default app;
