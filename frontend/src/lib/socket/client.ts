import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "@/lib/constants";

let socket: Socket | null = null;
let activeToken: string | null = null;

export function connectSocket(token: string): Socket {
  if (socket && activeToken === token) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  disconnectSocket();

  activeToken = token;
  socket = io(SOCKET_BASE_URL, {
    auth: { token },
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

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function isSocketConnected(): boolean {
  return Boolean(socket?.connected);
}

export function disconnectSocket(): void {
  if (!socket) {
    activeToken = null;
    return;
  }

  socket.disconnect();
  socket.removeAllListeners();
  socket = null;
  activeToken = null;
}
