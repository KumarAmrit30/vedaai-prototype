import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { getCorsOrigins } from "../config/env";
import { logInfo } from "../utils/logger";

let io: Server | undefined;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: getCorsOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  logInfo("[SOCKET] Server initialized");
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
}

export async function closeSocket(): Promise<void> {
  if (!io) return;

  await io.close();
  io = undefined;
  logInfo("[SOCKET] Server closed");
}
