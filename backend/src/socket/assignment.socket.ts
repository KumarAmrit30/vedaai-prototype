import type { GeneratedPaper } from "../modules/assignment/assignment.types";
import { getIO } from "./index";

export interface AssignmentSocketPayload {
  assignmentId: string;
  status: "generating" | "completed" | "failed";
  progress: number;
  generatedPaper?: GeneratedPaper;
  failureReason?: string;
}

export interface AssignmentUpdatedPayload {
  assignmentId: string;
  status?: "pending" | "generating" | "completed" | "failed";
  progress?: number;
  generatedPaper?: GeneratedPaper;
}

export interface AssignmentDeletedPayload {
  assignmentId: string;
}

const FRONTEND_STATUS_MAP: Record<string, AssignmentUpdatedPayload["status"]> =
  {
    processing: "generating",
    generating: "generating",
    pending: "pending",
    completed: "completed",
    failed: "failed",
  };

function buildPayload(
  assignmentId: string,
  status: AssignmentSocketPayload["status"],
  progress: number,
  extras?: {
    generatedPaper?: GeneratedPaper;
    failureReason?: string;
  },
): AssignmentSocketPayload {
  const payload: AssignmentSocketPayload = {
    assignmentId,
    status,
    progress,
  };

  if (extras?.generatedPaper) {
    payload.generatedPaper = extras.generatedPaper;
  }

  if (extras?.failureReason) {
    payload.failureReason = extras.failureReason;
  }

  return payload;
}

export function emitAssignmentProcessing(
  assignmentId: string,
  progress: number,
): void {
  const payload = buildPayload(assignmentId, "generating", progress);
  getIO().emit("assignment:processing", payload);
  console.log("[SOCKET] assignment:processing", {
    assignmentId,
    progress,
  });
}

export function emitAssignmentCompleted(
  assignmentId: string,
  generatedPaper: GeneratedPaper,
): void {
  const payload = buildPayload(assignmentId, "completed", 100, {
    generatedPaper,
  });
  getIO().emit("assignment:completed", payload);
  console.log("[SOCKET] assignment:completed", { assignmentId });
}

export function emitAssignmentFailed(
  assignmentId: string,
  failureReason: string,
): void {
  const payload = buildPayload(assignmentId, "failed", 0, {
    failureReason,
  });
  getIO().emit("assignment:failed", payload);
  console.log("[SOCKET] assignment:failed", {
    assignmentId,
    failureReason,
  });
}

export function emitAssignmentUpdated(payload: AssignmentUpdatedPayload): void {
  getIO().emit("assignment:updated", payload);
  console.log("[SOCKET] assignment:updated", payload);
}

export function emitAssignmentDeleted(payload: AssignmentDeletedPayload): void {
  getIO().emit("assignment:deleted", payload);
  console.log("[SOCKET] assignment:deleted", payload);
}

export function mapStatusForFrontend(
  status: string,
): NonNullable<AssignmentUpdatedPayload["status"]> {
  return FRONTEND_STATUS_MAP[status] ?? "pending";
}
