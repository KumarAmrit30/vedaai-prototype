import Redis, { type RedisOptions } from "ioredis";
import { env } from "../config/env";
import { logError, logInfo, logWarn } from "../utils/logger";
import {
  createRedisRetryStrategy,
  isRedisQuotaError,
  markRedisQuotaExceeded,
  shouldReconnectOnError,
} from "./redis-quota";

export let sharedConnection: Redis;
export let queueConnection: Redis;
/** Same underlying client as queueConnection — BullMQ worker still opens one blocking duplicate. */
export let workerConnection: Redis;

function isUpstashUrl(): boolean {
  return env.redisUrl?.includes("upstash.io") ?? false;
}

function buildBaseOptions(label: string): RedisOptions {
  const upstash = isUpstashUrl();

  return {
    maxRetriesPerRequest: null,
    // Fewer round-trips on serverless Redis; BullMQ performs its own version check.
    enableReadyCheck: !upstash,
    retryStrategy: createRedisRetryStrategy(label),
    reconnectOnError: shouldReconnectOnError,
    ...(upstash
      ? {
          connectTimeout: 10_000,
          commandTimeout: 15_000,
          keepAlive: 30_000,
        }
      : {}),
  };
}

function createClient(label: string, options?: RedisOptions): Redis {
  const base = buildBaseOptions(label);

  const client = env.redisUrl
    ? new Redis(env.redisUrl, { ...base, ...options })
    : new Redis({
        host: env.redisHost,
        port: env.redisPort,
        ...base,
        ...options,
      });

  client.on("error", (error: Error) => {
    if (isRedisQuotaError(error)) {
      markRedisQuotaExceeded(error);
    }

    logError(`[REDIS] ${label} error`, { message: error.message });
  });

  return client;
}

export async function connectRedis(): Promise<void> {
  sharedConnection = createClient("shared");
  queueConnection = sharedConnection;
  workerConnection = sharedConnection;

  try {
    await sharedConnection.ping();
    logInfo("[REDIS] Connected successfully", {
      upstash: isUpstashUrl(),
      connections: "1 shared (+ 1 BullMQ blocking duplicate when worker runs)",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("[REDIS] Connection failed", { message });
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (!sharedConnection) return;

  try {
    await sharedConnection.quit();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logWarn("[REDIS] Disconnect warning", { message });
  }

  logInfo("[REDIS] Connections closed");
}
