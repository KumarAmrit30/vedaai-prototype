const DEFAULT_CLIENT_URL = "http://localhost:3000";
const DEFAULT_PORT = 8000;

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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  mongodbUri: readRequired("MONGODB_URI"),
  geminiApiKey: readRequired("GEMINI_API_KEY"),
  clientUrl: readOptional("CLIENT_URL", DEFAULT_CLIENT_URL),
  redisUrl: process.env.REDIS_URL?.trim() || undefined,
  redisHost: process.env.REDIS_HOST?.trim() || "127.0.0.1",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
};

export function validateEnv(): void {
  readRequired("MONGODB_URI");
  readRequired("GEMINI_API_KEY");

  if (!env.redisUrl && !env.redisHost) {
    throw new Error(
      "[ENV] Redis is not configured. Set REDIS_URL or REDIS_HOST/REDIS_PORT.",
    );
  }

  if (Number.isNaN(env.port) || env.port <= 0) {
    throw new Error("[ENV] PORT must be a positive number.");
  }
}

export function getCorsOrigins(): string[] {
  return env.clientUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
