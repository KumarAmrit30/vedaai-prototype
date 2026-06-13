import { FinishReason, ResponseSchema, VertexAI } from "@google-cloud/vertexai";
import { env } from "../../../config/env";
import { logError, logInfo } from "../../../utils/logger";
import { retryAIRequest } from "../retry-ai-request";
import { withRequestTimeout } from "../request-timeout";
import { VERTEX_ASSIGNMENT_RESPONSE_SCHEMA } from "../vertex-exam-schema";
import {
  VertexGenerationBlockedError,
  VertexGenerationTruncatedError,
} from "../vertex-generation-errors";
import type {
  AIProvider,
  GenerateJsonOptions,
  GenerateTextOptions,
  HealthCheckResult,
  ProviderGenerationResult,
  ProviderTokenMetrics,
} from "../interfaces/AIProvider";

interface VertexGenerateContentResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string | null }> };
    finishReason?: FinishReason;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

function extractTokenMetrics(
  usageMetadata: VertexGenerateContentResponse["usageMetadata"],
): ProviderTokenMetrics {
  if (!usageMetadata) {
    return {};
  }

  const metrics: ProviderTokenMetrics = {};

  if (usageMetadata.promptTokenCount !== undefined) {
    metrics.promptTokens = usageMetadata.promptTokenCount;
  }

  if (usageMetadata.candidatesTokenCount !== undefined) {
    metrics.completionTokens = usageMetadata.candidatesTokenCount;
  }

  if (usageMetadata.totalTokenCount !== undefined) {
    metrics.totalTokens = usageMetadata.totalTokenCount;
  }

  if (usageMetadata.thoughtsTokenCount !== undefined) {
    metrics.thoughtsTokens = usageMetadata.thoughtsTokenCount;
  }

  return metrics;
}

function assertFinishReason(
  finishReason: FinishReason | undefined,
): void {
  if (finishReason === FinishReason.MAX_TOKENS) {
    throw new VertexGenerationTruncatedError();
  }

  if (finishReason === FinishReason.SAFETY) {
    throw new VertexGenerationBlockedError("SAFETY");
  }

  if (finishReason === FinishReason.RECITATION) {
    throw new VertexGenerationBlockedError("RECITATION");
  }
}

function extractResponseText(
  candidates: VertexGenerateContentResponse["candidates"],
): string {
  const text = (candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Vertex returned an empty response");
  }

  return text;
}

function processVertexResponse(
  response: VertexGenerateContentResponse,
  mode: "text" | "json",
): { text: string; metrics: ProviderTokenMetrics } {
  const candidate = response.candidates?.[0];
  assertFinishReason(candidate?.finishReason);

  const text = extractResponseText(response.candidates);

  if (mode === "json") {
    JSON.parse(text);
  }

  return {
    text,
    metrics: extractTokenMetrics(response.usageMetadata),
  };
}

export class VertexProvider implements AIProvider {
  readonly name = "VERTEX";
  readonly model: string;
  private readonly vertexAI: VertexAI;

  constructor() {
    if (!env.gcpProjectId) {
      throw new Error(
        "GCP_PROJECT_ID is required when AI_PROVIDER=vertex.",
      );
    }

    this.model = env.vertexModel;
    this.vertexAI = new VertexAI({
      project: env.gcpProjectId,
      location: env.vertexLocation,
    });
  }

  async generateText(
    options: GenerateTextOptions,
  ): Promise<ProviderGenerationResult> {
    const model = this.vertexAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens ?? env.vertexMaxOutputTokens,
        temperature: options.temperature ?? 0,
        topP: env.vertexTopP,
      },
    });

    return this.executeRequest(model, options.prompt, "text");
  }

  async generateJson(
    options: GenerateJsonOptions,
  ): Promise<ProviderGenerationResult> {
    const model = this.vertexAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: options.schema as ResponseSchema,
        maxOutputTokens: options.maxOutputTokens ?? env.vertexMaxOutputTokens,
        temperature: options.temperature ?? 0,
        topP: env.vertexTopP,
      },
    });

    return this.executeRequest(model, options.prompt, "json");
  }

  async generateAssignment(
    prompt: string,
  ): Promise<ProviderGenerationResult> {
    logInfo("[AI][VERTEX] Generation started", { model: this.model });

    try {
      const result = await this.generateJson({
        prompt,
        schema: VERTEX_ASSIGNMENT_RESPONSE_SCHEMA,
      });

      logInfo("[AI][VERTEX] Generation successful", {
        model: this.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        thoughtsTokens: result.thoughtsTokens,
      });
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Vertex error";
      logError("[AI][VERTEX] Generation failed", {
        message,
        model: this.model,
      });
      throw new Error(`Vertex generation failed: ${message}`);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    try {
      await this.generateText({
        prompt: "Reply with OK",
        maxOutputTokens: 16,
      });

      return {
        ok: true,
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeRequest(
    model: ReturnType<VertexAI["getGenerativeModel"]>,
    prompt: string,
    mode: "text" | "json",
  ): Promise<ProviderGenerationResult> {
    const { data, retryCount } = await retryAIRequest({
      provider: "Vertex",
      model: this.model,
      request: async () => {
        const result = await withRequestTimeout(
          model.generateContent({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
          }),
          env.aiRequestTimeoutMs,
          "Vertex",
          this.model,
        );

        return processVertexResponse(
          result.response as VertexGenerateContentResponse,
          mode,
        );
      },
    });

    return {
      text: data.text,
      retryCount,
      ...data.metrics,
    };
  }
}
