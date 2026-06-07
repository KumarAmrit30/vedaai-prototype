import Groq from "groq-sdk";
import { env } from "../../../config/env";
import { logError, logInfo } from "../../../utils/logger";
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

  async generateAssignment(prompt: string): Promise<string> {
    const model = env.groqModel;
    logInfo("[AI][GROQ] Generation started", { model });

    try {
      const completion = await getClient().chat.completions.create({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const text = completion.choices[0]?.message?.content;

      if (!text?.trim()) {
        throw new Error("Groq returned an empty response");
      }

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
