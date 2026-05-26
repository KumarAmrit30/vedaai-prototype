import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "@/lib/constants";

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_BASE_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected", reason);
    });

    socket.io.on("reconnect", (attempt) => {
      console.log("[SOCKET] Reconnected after attempt", attempt);
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      console.log("[SOCKET] Reconnect attempt", attempt);
    });

    socket.io.on("reconnect_error", (error) => {
      console.warn("[SOCKET] Reconnect error", error.message);
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function getSocket(): Socket {
  return connectSocket();
}

export function isSocketConnected(): boolean {
  return Boolean(socket?.connected);
}
