export const QUEUE_UNAVAILABLE_CODE = "QUEUE_UNAVAILABLE";

export const QUEUE_UNAVAILABLE_MESSAGE =
  "Assignment generation is temporarily unavailable. Please try again later.";

export class QueueUnavailableError extends Error {
  readonly code = QUEUE_UNAVAILABLE_CODE;
  readonly statusCode = 503;

  constructor() {
    super(QUEUE_UNAVAILABLE_MESSAGE);
    this.name = "QueueUnavailableError";
  }
}

export function isQueueUnavailableError(
  error: unknown,
): error is QueueUnavailableError {
  return error instanceof QueueUnavailableError;
}
