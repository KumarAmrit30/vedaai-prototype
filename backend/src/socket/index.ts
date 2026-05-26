import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";

let io: Server | undefined;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log("[SOCKET] Client connected:", socket.id);

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Client disconnected:", socket.id, reason);
    });
  });

  console.log("[SOCKET] Server initialized");
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
  console.log("[SOCKET] Server closed");
}
