export class AIRequestTimeoutError extends Error {
  readonly provider: string;
  readonly model: string;
  readonly timeoutMs: number;

  constructor(provider: string, model: string, timeoutMs: number) {
    super(`${provider} request timed out after ${timeoutMs}ms`);
    this.name = "AIRequestTimeoutError";
    this.provider = provider;
    this.model = model;
    this.timeoutMs = timeoutMs;
  }
}

export async function withRequestTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  provider: string,
  model: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new AIRequestTimeoutError(provider, model, timeoutMs));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}
