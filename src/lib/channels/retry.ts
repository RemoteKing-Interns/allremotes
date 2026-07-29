import type { Marketplace } from "./core";

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  onRetry?: (error: unknown, attempt: number) => void;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, delayMs = 1000, onRetry } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        if (onRetry) onRetry(err, attempt + 1);
        await new Promise((resolve) => setTimeout(resolve, delayMs * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

export function isRetryableError(err: any): boolean {
  const status = err?.status || err?.response?.status;
  if (status === 429) return true;
  if (status >= 500) return true;
  if (err?.code === "ECONNRESET" || err?.code === "ETIMEDOUT" || err?.code === "ECONNREFUSED") return true;
  return false;
}
