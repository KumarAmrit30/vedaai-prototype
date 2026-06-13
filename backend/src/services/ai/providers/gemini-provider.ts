import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env";
import { logError, logInfo } from "../../../utils/logger";
import { retryAIRequest } from "../retry-ai-request";
import { withRequestTimeout } from "../request-timeout";
import type {
  AIProvider,
  GenerateJsonOptions,
  GenerateTextOptions,
  HealthCheckResult,
  ProviderGenerationResult,
} from "../interfaces/AIProvider";

let genAI: GoogleGenerativeAI | undefined;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.geminiApiKey!);
  }

  return genAI;
}

export class GeminiProvider implements AIProvider {
  readonly name = "GEMINI";
  readonly model = env.geminiModel;

  async generateText(
    options: GenerateTextOptions,
  ): Promise<ProviderGenerationResult> {
    return this.runGeneration(options.prompt, options.temperature);
  }

  async generateJson(
    options: GenerateJsonOptions,
  ): Promise<ProviderGenerationResult> {
    const schemaHint = `\n\nReturn ONLY valid JSON matching this schema:\n${JSON.stringify(options.schema)}`;
    return this.runGeneration(
      `${options.prompt}${schemaHint}`,
      options.temperature,
    );
  }

  async generateAssignment(prompt: string): Promise<ProviderGenerationResult> {
    const model = this.model;
    logInfo("[AI][GEMINI] Generation started", { model });

    try {
      const result = await this.generateText({ prompt });
      logInfo("[AI][GEMINI] Generation successful", { model });
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Gemini error";
      logError("[AI][GEMINI] Generation failed", { message, model });
      throw new Error(`Gemini generation failed: ${message}`);
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    try {
      await this.generateText({ prompt: "Reply with OK" });
      return { ok: true, latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        ok: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async runGeneration(
    prompt: string,
    temperature?: number,
  ): Promise<ProviderGenerationResult> {
    const model = this.model;

    const { data: text, retryCount } = await retryAIRequest({
      provider: "Gemini",
      model,
      request: async () => {
        const generativeModel = getClient().getGenerativeModel({
          model,
          ...(temperature !== undefined
            ? { generationConfig: { temperature } }
            : {}),
        });
        const result = await withRequestTimeout(
          generativeModel.generateContent(prompt),
          env.aiRequestTimeoutMs,
          "Gemini",
          model,
        );
        const responseText = result.response.text();

        if (!responseText?.trim()) {
          throw new Error("Gemini returned an empty response");
        }

        return responseText;
      },
    });

    return { text, retryCount };
  }
}
