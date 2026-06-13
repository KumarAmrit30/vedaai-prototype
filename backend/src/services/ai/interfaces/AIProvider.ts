export interface ProviderTokenMetrics {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  thoughtsTokens?: number;
}

export interface ProviderGenerationResult extends ProviderTokenMetrics {
  text: string;
  retryCount: number;
}

export interface GenerateTextOptions {
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateJsonOptions extends GenerateTextOptions {
  schema: unknown;
}

export interface HealthCheckResult {
  ok: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Pluggable AI backend contract for exam generation.
 */
export interface AIProvider {
  readonly name: string;
  readonly model: string;
  generateText(options: GenerateTextOptions): Promise<ProviderGenerationResult>;
  generateJson(options: GenerateJsonOptions): Promise<ProviderGenerationResult>;
  healthCheck(): Promise<HealthCheckResult>;
  /**
   * Backward-compatible entry point used by the assignment pipeline. An
   * optional structured-output schema can be supplied (used by Vertex for
   * both paper generation and on-demand solution generation).
   */
  generateAssignment(
    prompt: string,
    responseSchema?: unknown,
  ): Promise<ProviderGenerationResult>;
}
