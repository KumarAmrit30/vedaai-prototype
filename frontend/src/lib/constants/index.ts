export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (API_BASE_URL.replace(/\/api\/?$/, "") || "http://localhost:8000");

export const ASSIGNMENT_STATUS = {
  PENDING: "pending",
  GENERATING: "generating",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
