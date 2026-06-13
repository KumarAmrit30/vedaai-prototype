import { logError, logInfo, logWarn } from "../../utils/logger";
import { AIRequestTimeoutError } from "./request-timeout";

export const MAX_ATTEMPTS = 4;
const MAX_BACKOFF_MS = 15_000;
const BASE_BACKOFF_MS = 1000;
const JITTER_MAX_MS = 500;

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ENETUNREACH",
]);

const NON_RETRYABLE_HTTP_STATUSES = new Set([
  400,
  401,
  402,
  403,
  404,
  409,
  413,
  422,
]);

const NON_RETRYABLE_MESSAGE_PATTERNS = [
  "failed to parse ai response",
  "ai response validation failed",
  "validation failed",
  "returned an empty response",
  "insufficient",
  "billing",
  "payment required",
  "quota exceeded",
  "exceeded your current quota",
  "credits",
  "insufficient_quota",
  "invalid api key",
  "incorrect api key",
  "unauthorized",
  "permission denied",
  "generation truncated",
  "generation blocked",
];

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function hasNonRetryableMessage(error: Error): boolean {
  const message = error.message.toLowerCase();

  return NON_RETRYABLE_MESSAGE_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
}

export function computeRetryDelayMs(attempt: number): number {
  const exponentialDelay = Math.min(
    BASE_BACKOFF_MS * 2 ** attempt,
    MAX_BACKOFF_MS,
  );
  const jitter = Math.floor(Math.random() * (JITTER_MAX_MS + 1));

  return exponentialDelay + jitter;
}

export function isRetryableAIError(error: unknown): boolean {
  if (error instanceof AIRequestTimeoutError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const status = getErrorStatus(error);

  if (status === 429) {
    return true;
  }

  if (hasNonRetryableMessage(error)) {
    return false;
  }

  if (typeof status === "number") {
    if (NON_RETRYABLE_HTTP_STATUSES.has(status)) {
      return false;
    }

    if (status >= 500 && status < 600) {
      return true;
    }

    if (status >= 400 && status < 500) {
      return false;
    }
  }

  const code = (error as NodeJS.ErrnoException).code;
  if (code && RETRYABLE_NETWORK_CODES.has(code)) {
    return true;
  }

  const message = error.message.toLowerCase();

  if (message.includes("timed out after") && message.includes("ms")) {
    return true;
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network error") ||
    message.includes("socket hang up") ||
    message.includes("econnreset") ||
    message.includes("econnrefused")
  ) {
    return true;
  }

  const cause = (error as { cause?: unknown }).cause;
  if (cause && cause !== error) {
    return isRetryableAIError(cause);
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface RetryAIRequestOptions<T> {
  provider: string;
  model: string;
  request: () => Promise<T>;
}

export interface RetryAIRequestResult<T> {
  data: T;
  retryCount: number;
}

export async function retryAIRequest<T>(
  options: RetryAIRequestOptions<T>,
): Promise<RetryAIRequestResult<T>> {
  const { provider, model, request } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await request();

      if (attempt > 1) {
        logInfo("[AI][RETRY] Retry successful", { provider, model });
      }

      return {
        data: result,
        retryCount: attempt - 1,
      };
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message : "Unknown provider error";
      const isLastAttempt = attempt === MAX_ATTEMPTS;
      const shouldRetry = !isLastAttempt && isRetryableAIError(error);

      if (!shouldRetry) {
        if (attempt > 1) {
          logError("[AI][RETRY] Retry failed", { provider, model, message });
        }

        throw error;
      }

      const delayMs = computeRetryDelayMs(attempt);

      logWarn(`[AI][RETRY] Attempt ${attempt} failed`, {
        provider,
        model,
        message,
        delayMs,
      });
      logInfo("[AI][RETRY] Retrying request", { provider, model, delayMs });
      await sleep(delayMs);
    }
  }

  throw lastError;
}
