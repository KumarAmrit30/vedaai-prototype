import Redis, { type RedisOptions } from "ioredis";

export let sharedConnection: Redis;
export let queueConnection: Redis;
export let workerConnection: Redis;

function buildRedisOptions(): RedisOptions {
  const url = process.env.REDIS_URL;

  if (url) {
    return { maxRetriesPerRequest: null };
  }

  const host = process.env.REDIS_HOST ?? "127.0.0.1";
  const port = Number(process.env.REDIS_PORT ?? 6379);

  return {
    host,
    port,
    maxRetriesPerRequest: null,
  };
}

function createClient(label: string, options?: RedisOptions): Redis {
  const url = process.env.REDIS_URL;
  const client = url
    ? new Redis(url, { maxRetriesPerRequest: null, ...options })
    : new Redis({ ...buildRedisOptions(), ...options });

  client.on("error", (error: Error) => {
    console.error(`[REDIS] ${label} error:`, error.message);
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
    console.log("[REDIS] Connected successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[REDIS] Connection failed:", message);
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
      console.warn("[REDIS] Disconnect warning:", message);
    }
  }

  console.log("[REDIS] Connections closed");
}
