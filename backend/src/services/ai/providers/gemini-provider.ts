import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env";
import { logError, logInfo } from "../../../utils/logger";
import { retryAIRequest } from "../retry-ai-request";
import { withRequestTimeout } from "../request-timeout";
import type { AIProvider, ProviderGenerationResult } from "./ai-provider";

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

  async generateAssignment(prompt: string): Promise<ProviderGenerationResult> {
    const model = this.model;
    logInfo("[AI][GEMINI] Generation started", { model });

    try {
      const { data: text, retryCount } = await retryAIRequest({
        provider: "Gemini",
        model,
        request: async () => {
          const generativeModel = getClient().getGenerativeModel({ model });
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

      logInfo("[AI][GEMINI] Generation successful", { model });
      return { text, retryCount };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Gemini error";
      logError("[AI][GEMINI] Generation failed", { message, model });
      throw new Error(`Gemini generation failed: ${message}`);
    }
  }
}
