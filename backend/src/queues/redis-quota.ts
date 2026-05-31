import { logError } from "../utils/logger";

const QUOTA_ERROR_PATTERN = /max requests limit exceeded/i;

let quotaExceeded = false;
let quotaLogged = false;

export function isRedisQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return QUOTA_ERROR_PATTERN.test(message);
}

export function isRedisQuotaExceeded(): boolean {
  return quotaExceeded;
}

export function markRedisQuotaExceeded(error?: unknown): void {
  if (quotaExceeded) return;

  quotaExceeded = true;

  if (!quotaLogged) {
    quotaLogged = true;
    const message =
      error instanceof Error ? error.message : "Upstash request quota exceeded";
    logError("[REDIS] Request quota exceeded — queue activity will stop", {
      message,
    });
  }
}

/**
 * Stop retrying after a few attempts, or immediately when quota is hit.
 * Returning null tells ioredis not to reconnect (avoids request storms).
 */
export function createRedisRetryStrategy(_label: string) {
  return (times: number): number | null => {
    if (quotaExceeded) {
      return null;
    }

    if (times > 3) {
      return null;
    }

    const delay = Math.min(times * 2_000, 10_000);
    return delay;
  };
}

export function shouldReconnectOnError(error: Error): boolean | 1 | 2 {
  if (isRedisQuotaError(error)) {
    markRedisQuotaExceeded(error);
    return false;
  }

  return false;
}
