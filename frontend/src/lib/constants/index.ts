const DEV_API_URL = "http://localhost:8000/api";
const DEV_SOCKET_URL = "http://localhost:8000";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEV_API_URL;

export const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
  API_BASE_URL.replace(/\/api\/?$/, "") ||
  DEV_SOCKET_URL;

export const ASSIGNMENT_STATUS = {
  PENDING: "pending",
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
