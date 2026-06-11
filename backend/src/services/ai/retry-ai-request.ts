import { logError, logInfo, logWarn } from "../../utils/logger";
import { AIRequestTimeoutError } from "./request-timeout";

const RETRY_DELAY_MS = 1000;
const MAX_ATTEMPTS = 2;

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ENETUNREACH",
]);

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof AIRequestTimeoutError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const status = getErrorStatus(error);

  if (typeof status === "number") {
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
    return isRetryableError(cause);
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
      const shouldRetry = !isLastAttempt && isRetryableError(error);

      if (!shouldRetry) {
        if (attempt > 1) {
          logError("[AI][RETRY] Retry failed", { provider, model, message });
        }

        throw error;
      }

      logWarn(`[AI][RETRY] Attempt ${attempt} failed`, {
        provider,
        model,
        message,
      });
      logInfo("[AI][RETRY] Retrying request", { provider, model });
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}
