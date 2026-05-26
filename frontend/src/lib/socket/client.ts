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

    socket.io.on("reconnect_error", () => {
      // Reconnection feedback is handled in useAssignmentSocket via toasts.
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
