const DEFAULT_CLIENT_URL = "http://localhost:3000";
const DEFAULT_PORT = 8000;
const DEFAULT_AI_PROVIDER = "groq";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_AI_REQUEST_TIMEOUT_MS = 45_000;

export const AI_PROVIDERS = ["gemini", "groq"] as const;
export type AIProviderName = (typeof AI_PROVIDERS)[number];

function readRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `[ENV] Missing required environment variable: ${name}. ` +
        "Copy backend/.env.example to backend/.env and fill in all values.",
    );
  }
  return value;
}

function readOptional(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function readBoolean(name: string, fallback = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) return fallback;

  return value === "true" || value === "1" || value === "yes";
}

function readOptionalPositiveNumber(name: string, fallback: number): number {
  const value = process.env[name]?.trim();

  if (!value) return fallback;

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `[ENV] ${name} must be a positive number. Got: ${value}`,
    );
  }

  return parsed;
}

function readFirebasePrivateKey(): string | undefined {
  const value = process.env.FIREBASE_PRIVATE_KEY?.trim();

  if (!value) return undefined;

  return value.replace(/\\n/g, "\n");
}

function readAIProvider(): AIProviderName {
  const value = readOptional("AI_PROVIDER", DEFAULT_AI_PROVIDER).toLowerCase();

  if (!AI_PROVIDERS.includes(value as AIProviderName)) {
    throw new Error(
      `[ENV] AI_PROVIDER must be one of: ${AI_PROVIDERS.join(", ")}. Got: ${value}`,
    );
  }

  return value as AIProviderName;
}

function readModelName(envKey: string, fallback: string): string {
  const model = readOptional(envKey, fallback).trim();

  if (!model) {
    throw new Error(`[ENV] ${envKey} must not be empty.`);
  }

  return model;
}

export function getActiveAIModel(): string {
  return env.aiProvider === "gemini" ? env.geminiModel : env.groqModel;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  mongodbUri: readRequired("MONGODB_URI"),
  aiProvider: readAIProvider(),
  geminiApiKey: process.env.GEMINI_API_KEY?.trim() || undefined,
  geminiModel: readModelName("GEMINI_MODEL", DEFAULT_GEMINI_MODEL),
  groqApiKey: process.env.GROQ_API_KEY?.trim() || undefined,
  groqModel: readModelName("GROQ_MODEL", DEFAULT_GROQ_MODEL),
  aiRequestTimeoutMs: readOptionalPositiveNumber(
    "AI_REQUEST_TIMEOUT_MS",
    DEFAULT_AI_REQUEST_TIMEOUT_MS,
  ),
  clientUrl: readOptional("CLIENT_URL", DEFAULT_CLIENT_URL),
  redisUrl: process.env.REDIS_URL?.trim() || undefined,
  redisHost: process.env.REDIS_HOST?.trim() || "127.0.0.1",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  authEnabled: readBoolean("AUTH_ENABLED", false),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID?.trim() || undefined,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL?.trim() || undefined,
  firebasePrivateKey: readFirebasePrivateKey(),
};

export function validateEnv(): void {
  readRequired("MONGODB_URI");

  if (env.aiProvider === "gemini" && !env.geminiApiKey) {
    throw new Error(
      "[ENV] GEMINI_API_KEY is required when AI_PROVIDER=gemini.",
    );
  }

  if (env.aiProvider === "groq" && !env.groqApiKey) {
    throw new Error("[ENV] GROQ_API_KEY is required when AI_PROVIDER=groq.");
  }

  if (env.aiProvider === "groq" && !env.groqModel.trim()) {
    throw new Error("[ENV] GROQ_MODEL must not be empty when AI_PROVIDER=groq.");
  }

  if (!env.redisUrl && !env.redisHost) {
    throw new Error(
      "[ENV] Redis is not configured. Set REDIS_URL or REDIS_HOST/REDIS_PORT.",
    );
  }

  if (Number.isNaN(env.port) || env.port <= 0) {
    throw new Error("[ENV] PORT must be a positive number.");
  }

  if (env.authEnabled) {
    if (!env.firebaseProjectId) {
      throw new Error(
        "[ENV] FIREBASE_PROJECT_ID is required when AUTH_ENABLED=true.",
      );
    }

    if (!env.firebaseClientEmail) {
      throw new Error(
        "[ENV] FIREBASE_CLIENT_EMAIL is required when AUTH_ENABLED=true.",
      );
    }

    if (!env.firebasePrivateKey) {
      throw new Error(
        "[ENV] FIREBASE_PRIVATE_KEY is required when AUTH_ENABLED=true.",
      );
    }
  }
}

export function getCorsOrigins(): string[] {
  return env.clientUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
