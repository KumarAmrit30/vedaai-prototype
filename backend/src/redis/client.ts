import Redis from "ioredis";

export let redis: Redis;

export async function connectRedis(): Promise<void> {
  const url = process.env.REDIS_URL;

  if (!url) {
    throw new Error("REDIS_URL environment variable is not defined");
  }

  redis = new Redis(url);

  redis.on("error", (error: Error) => {
    console.error("Redis error:", error.message);
  });

  try {
    await redis.ping();
    console.log("Redis connected successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Redis connection failed:", message);
    throw error;
  }
}
