import "dotenv/config";
import app from "./app";
import { connectDB } from "./db/connect";
import {
  initAssignmentQueue,
} from "./queues/assignment.queue";
import { startAssignmentWorker } from "./queues/workers/assignment.worker";
import { connectRedis } from "./redis/client";

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  try {
    await connectDB();
    await connectRedis();

    initAssignmentQueue();
    await startAssignmentWorker();

    const server = app.listen(PORT, () => {
      console.log(`VedaAI backend started on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      console.error("Failed to start server:", error.message);
      process.exit(1);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to start application:", message);
    process.exit(1);
  }
}

startServer();
