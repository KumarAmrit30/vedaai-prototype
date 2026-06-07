import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { getCorsOrigins, env } from "../config/env";
import { getFirebaseAuth } from "../config/firebase-admin";
import { logInfo, logWarn } from "../utils/logger";

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

let io: Server | undefined;

function userRoom(userId: string): string {
  return `user:${userId}`;
}

async function authenticateSocket(socket: AuthenticatedSocket): Promise<string> {
  if (!env.authEnabled) {
    throw new Error("Socket authentication requires AUTH_ENABLED=true");
  }

  const token = socket.handshake.auth?.token;

  if (!token || typeof token !== "string") {
    throw new Error("Authentication required");
  }

  const decoded = await getFirebaseAuth().verifyIdToken(token);
  return decoded.uid;
}

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

  io.use(async (socket, next) => {
    try {
      const userId = await authenticateSocket(socket as AuthenticatedSocket);
      (socket as AuthenticatedSocket).data.userId = userId;
      next();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Socket authentication failed";
      logWarn("[SOCKET] Connection rejected", { message });
      next(new Error(message));
    }
  });

  io.on("connection", (socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.data.userId;

    void authSocket.join(userRoom(userId));

    logInfo("[SOCKET] Client connected", { uid: userId });
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
