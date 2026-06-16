/**
 * Fetches a URL with automatic retries and exponential backoff.
 * Used by any route that depends on a third-party API (weather, currency, fun facts, etc.)
 * so a single slow/flaky upstream doesn't immediately fail the request.
 */
export interface RetryOptions {
  retries?: number; // total attempts including the first one
  baseDelayMs?: number; // delay before the 2nd attempt; doubles each retry
  timeoutMs?: number; // per-attempt timeout
}

export class UpstreamError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "UpstreamError";
  }
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: RetryOptions = {}
): Promise<Response> {
  const { retries = 3, baseDelayMs = 250, timeoutMs = 5000 } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);

      // Retry on 5xx (upstream issue) but not on 4xx (our request is wrong)
      if (response.status >= 500 && attempt < retries) {
        await delay(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt < retries) {
        await delay(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
    }
  }

  throw new UpstreamError(
    `Failed to reach upstream after ${retries} attempts: ${(lastError as Error)?.message ?? "unknown error"}`
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
