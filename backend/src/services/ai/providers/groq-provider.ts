import Groq from "groq-sdk";
import { env } from "../../../config/env";
import { logError, logInfo } from "../../../utils/logger";
import { retryAIRequest } from "../retry-ai-request";
import { withRequestTimeout } from "../request-timeout";
import type { AIProvider } from "./ai-provider";

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

  async generateAssignment(prompt: string): Promise<string> {
    const model = this.model;
    logInfo("[AI][GROQ] Generation started", { model });

    try {
      const text = await retryAIRequest({
        provider: "Groq",
        model,
        request: async () => {
          const completion = await withRequestTimeout(
            getClient().chat.completions.create({
              model,
              temperature: 0.4,
              response_format: { type: "json_object" },
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
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

      logInfo("[AI][GROQ] Generation successful", { model });
      return text;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown Groq error";
      logError("[AI][GROQ] Generation failed", { message, model });
      throw new Error(`Groq generation failed: ${message}`);
    }
  }
}
