import Groq from "groq-sdk";
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

let groqClient: Groq | undefined;

function getClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: env.groqApiKey! });
  }

  return groqClient;
}

export class GroqProvider implements AIProvider {
  readonly name = "GROQ";
  readonly model = env.groqModel;

  async generateText(
    options: GenerateTextOptions,
  ): Promise<ProviderGenerationResult> {
    return this.runCompletion({
      prompt: options.prompt,
      jsonMode: false,
      temperature: options.temperature ?? 0.2,
    });
  }

  async generateJson(
    options: GenerateJsonOptions,
  ): Promise<ProviderGenerationResult> {
    return this.runCompletion({
      prompt: options.prompt,
      jsonMode: true,
      temperature: options.temperature ?? 0.2,
    });
  }

  async generateAssignment(
    prompt: string,
    _responseSchema?: unknown,
  ): Promise<ProviderGenerationResult> {
    void _responseSchema;
    const model = this.model;
    logInfo("[AI][GROQ] Generation started", { model });

    try {
      const result = await this.runCompletion({
        prompt,
        jsonMode: true,
        temperature: 0.2,
      });
      logInfo("[AI][GROQ] Generation successful", { model });
      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Groq error";
      logError("[AI][GROQ] Generation failed", { message, model });
      throw new Error(`Groq generation failed: ${message}`);
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

  private async runCompletion(options: {
    prompt: string;
    jsonMode: boolean;
    temperature: number;
  }): Promise<ProviderGenerationResult> {
    const model = this.model;

    const { data: text, retryCount } = await retryAIRequest({
      provider: "Groq",
      model,
      request: async () => {
        const completion = await withRequestTimeout(
          getClient().chat.completions.create({
            model,
            temperature: options.temperature,
            ...(options.jsonMode
              ? { response_format: { type: "json_object" as const } }
              : {}),
            messages: [{ role: "user", content: options.prompt }],
          }),
          env.aiRequestTimeoutMs,
          "Groq",
          model,
        );

        const responseText = completion.choices[0]?.message?.content;

        if (!responseText?.trim()) {
          throw new Error("Groq returned an empty response");
        }

        return responseText;
      },
    });

    return { text, retryCount };
  }
}
