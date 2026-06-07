import { env } from "../../../config/env";
import type { AIProvider } from "./ai-provider";
import { GeminiProvider } from "./gemini-provider";
import { GroqProvider } from "./groq-provider";

let cachedProvider: AIProvider | undefined;

export function getAIProvider(): AIProvider {
  if (cachedProvider) {
    return cachedProvider;
  }

  switch (env.aiProvider) {
    case "gemini":
      cachedProvider = new GeminiProvider();
      break;
    case "groq":
      cachedProvider = new GroqProvider();
      break;
    default:
      throw new Error(`Unsupported AI provider: ${env.aiProvider}`);
  }

  return cachedProvider;
}

export type { AIProvider } from "./ai-provider";
