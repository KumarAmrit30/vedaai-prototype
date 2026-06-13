import type { AIProvider } from "../interfaces/AIProvider";
import { GeminiProvider } from "../providers/gemini-provider";
import { GroqProvider } from "../providers/groq-provider";
import { VertexProvider } from "../providers/VertexProvider";
import type { AIProviderName } from "../../../config/env";

export function createAIProvider(type: AIProviderName): AIProvider {
  switch (type) {
    case "vertex":
      return new VertexProvider();
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    default: {
      const exhaustive: never = type;
      throw new Error(`Unsupported AI provider: ${exhaustive}`);
    }
  }
}
