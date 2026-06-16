/**
 * Bindings available to the Kyzen API worker.
 * Mirrors the [[kv_namespaces]] and [vars] sections of wrangler.toml.
 */
export interface Bindings {
  // KV namespaces
  RATE_LIMIT_KV: KVNamespace;
  SHORTURL_KV: KVNamespace;

  // Plain vars (wrangler.toml [vars])
  ENVIRONMENT: string;
  RATE_LIMIT_MAX: string;
  RATE_LIMIT_WINDOW_SECONDS: string;

  // Secrets (set via `wrangler secret put`)
  OPENWEATHER_API_KEY?: string;
  EXCHANGE_RATE_API_KEY?: string;
  AI_API_KEY?: string;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    requestId: string;
  };
};
