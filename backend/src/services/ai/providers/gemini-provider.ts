import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../../config/env";
import { logError, logInfo } from "../../../utils/logger";
import type { AIProvider } from "./ai-provider";

const MODEL_NAME = "gemini-2.5-flash";

let genAI: GoogleGenerativeAI | undefined;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.geminiApiKey!);
  }

  return genAI;
}

export class GeminiProvider implements AIProvider {
  readonly name = "GEMINI";

  async generateAssignment(prompt: string): Promise<string> {
    logInfo("[AI][GEMINI] Generation started", { model: MODEL_NAME });

    try {
      const model = getClient().getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      if (!text?.trim()) {
        throw new Error("Gemini returned an empty response");
      }

      logInfo("[AI][GEMINI] Generation successful", { model: MODEL_NAME });
      return text;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Gemini error";
      logError("[AI][GEMINI] Generation failed", { message });
      throw new Error(`Gemini generation failed: ${message}`);
    }
  }
}
