import "dotenv/config";
import { createServer, type Server as HttpServer } from "node:http";
import app from "./app";
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
import { closeSocket, initSocket } from "./socket/index";

const PORT = Number(process.env.PORT) || 8000;

let server: HttpServer | undefined;
let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[SERVER] Received ${signal}, shutting down gracefully...`);

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
        console.log("[SERVER] HTTP server closed");
        resolve();
      });
    });

    await disconnectRedis();
    await disconnectDB();
    console.log("[SERVER] Shutdown complete");
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[SERVER] Shutdown error:", message);
    process.exit(1);
  }
}

async function startServer(): Promise<void> {
  try {
    await connectDB();
    await connectRedis();

    initAssignmentQueue();

    server = createServer(app);
    initSocket(server);
    await startAssignmentWorker();

    server.listen(PORT, () => {
      console.log(`[SERVER] VedaAI backend started on http://localhost:${PORT}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
      console.log(`[SERVER] WebSocket ready on http://localhost:${PORT}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error("[SERVER] Failed to start server:", error.message);
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
    console.error("[SERVER] Failed to start application:", message);
    process.exit(1);
  }
}

void startServer();
