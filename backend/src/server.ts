import "dotenv/config";
import { createServer, type Server as HttpServer } from "node:http";
import app from "./app";
import { env, validateEnv } from "./config/env";
import { connectDB, disconnectDB } from "./db/connect";
import {
  closeAssignmentQueue,
  initAssignmentQueue,
} from "./queues/assignment.queue";
import {
  closeAssignmentWorker,
  startAssignmentWorker,
} from "./queues/assignment.worker";
import { connectRedis, disconnectRedis } from "./queues/redis";
import { cleanupStaleUploads } from "./services/material-parser.service";
import { closeSocket, initSocket } from "./socket/index";
import { logError, logInfo } from "./utils/logger";

validateEnv();

let server: HttpServer | undefined;
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logInfo(`[SERVER] Received ${signal}, shutting down gracefully...`);

  try {
    await closeAssignmentWorker();
    await closeAssignmentQueue();
    await closeSocket();

    await new Promise<void>((resolve) => {
      if (!server) {
        resolve();
        return;
      }

      server.close(() => {
        logInfo("[SERVER] HTTP server closed");
        resolve();
      });
    });

    await disconnectRedis();
    await disconnectDB();
    logInfo("[SERVER] Shutdown complete");
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("[SERVER] Shutdown error", { message });
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  try {
    await connectDB();
    await connectRedis();
    await cleanupStaleUploads();

    initAssignmentQueue();

    server = createServer(app);
    initSocket(server);
    await startAssignmentWorker();

    server.listen(env.port, () => {
      logInfo("[SERVER] VedaAI backend started", {
        port: env.port,
        clientUrl: env.clientUrl,
        healthCheck: `/api/health`,
      });
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      logError("[SERVER] Failed to start server", { message: error.message });
      process.exit(1);
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("[SERVER] Failed to start application", { message });
    process.exit(1);
  }
}

void startServer();
