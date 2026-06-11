export type GenerationErrorCategory =
  | "parse_error"
  | "validation_error"
  | "provider_error"
  | "timeout_error"
  | "unknown_error";

export interface GenerationMetrics {
  provider?: string;
  model?: string;
  durationMs?: number;
  retryCount?: number;
  errorCategory?: string;
}

export function classifyGenerationError(error: unknown): GenerationErrorCategory {
  const message =
    error instanceof Error ? error.message.toLowerCase() : "unknown error";

  if (message.includes("failed to parse ai response")) {
    return "parse_error";
  }

  if (
    message.includes("validation failed") ||
    message.includes("ai response validation")
  ) {
    return "validation_error";
  }

  if (message.includes("timed out after")) {
    return "timeout_error";
  }

  if (message.includes("generation failed")) {
    return "provider_error";
  }

  return "unknown_error";
}

export class AssignmentGenerationError extends Error {
  readonly metrics: GenerationMetrics;

  constructor(message: string, metrics: GenerationMetrics) {
    super(message);
    this.name = "AssignmentGenerationError";
    this.metrics = metrics;
  }
}
