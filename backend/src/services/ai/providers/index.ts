import { env } from "../../../config/env";
import { createAIProvider } from "../factory/AIProviderFactory";
import type { AIProvider } from "../interfaces/AIProvider";

let cachedProvider: AIProvider | undefined;
let cachedProviderType: string | undefined;

export function getAIProvider(): AIProvider {
  if (cachedProvider && cachedProviderType === env.aiProvider) {
    return cachedProvider;
  }

  cachedProvider = createAIProvider(env.aiProvider);
  cachedProviderType = env.aiProvider;
  return cachedProvider;
}

/** Clears cached provider — useful in tests when env overrides change. */
export function resetAIProviderCache(): void {
  cachedProvider = undefined;
  cachedProviderType = undefined;
}

export type { AIProvider } from "../interfaces/AIProvider";
