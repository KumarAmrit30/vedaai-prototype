import Redis, { type RedisOptions } from "ioredis";
import { env } from "../config/env";
import { logError, logInfo, logWarn } from "../utils/logger";

export let sharedConnection: Redis;
export let queueConnection: Redis;
export let workerConnection: Redis;

function buildRedisOptions(): RedisOptions {
  if (env.redisUrl) {
    return { maxRetriesPerRequest: null };
  }

  return {
    host: env.redisHost,
    port: env.redisPort,
    maxRetriesPerRequest: null,
  };
}

function createClient(label: string, options?: RedisOptions): Redis {
  const client = env.redisUrl
    ? new Redis(env.redisUrl, { maxRetriesPerRequest: null, ...options })
    : new Redis({ ...buildRedisOptions(), ...options });

  client.on("error", (error: Error) => {
    logError(`[REDIS] ${label} error`, { message: error.message });
  });

  return client;
}

export async function connectRedis(): Promise<void> {
  sharedConnection = createClient("shared");
  queueConnection = sharedConnection;
  workerConnection = createClient("worker", {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  try {
    await sharedConnection.ping();
    logInfo("[REDIS] Connected successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("[REDIS] Connection failed", { message });
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  const clients = [workerConnection, sharedConnection].filter(Boolean);

  for (const client of clients) {
    try {
      await client.quit();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logWarn("[REDIS] Disconnect warning", { message });
    }
  }

  logInfo("[REDIS] Connections closed");
}
