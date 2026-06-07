import type { GeneratedPaper } from "../modules/assignment/assignment.types";
import type { AssignmentStatus } from "../modules/assignment/assignment.types";
import { normalizeAssignmentStatus } from "../modules/assignment/assignment.status";
import { getIO } from "./index";

export interface AssignmentSocketPayload {
  assignmentId: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  generatedPaper?: GeneratedPaper;
  failureReason?: string;
}

export interface AssignmentUpdatedPayload {
  assignmentId: string;
  status?: AssignmentStatus;
  progress?: number;
  generatedPaper?: GeneratedPaper;
}

export interface AssignmentDeletedPayload {
  assignmentId: string;
}

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
  getIO().emit(
    "assignment:processing",
    buildPayload(assignmentId, "processing", progress),
  );
}

export function emitAssignmentCompleted(
  assignmentId: string,
  generatedPaper: GeneratedPaper,
): void {
  getIO().emit(
    "assignment:completed",
    buildPayload(assignmentId, "completed", 100, { generatedPaper }),
  );
}

export function emitAssignmentFailed(
  assignmentId: string,
  failureReason: string,
): void {
  getIO().emit(
    "assignment:failed",
    buildPayload(assignmentId, "failed", 0, { failureReason }),
  );
}

export function emitAssignmentUpdated(payload: AssignmentUpdatedPayload): void {
  getIO().emit("assignment:updated", payload);
}

export function emitAssignmentDeleted(payload: AssignmentDeletedPayload): void {
  getIO().emit("assignment:deleted", payload);
}

export function mapStatusForApi(status: string): AssignmentStatus {
  return normalizeAssignmentStatus(status);
}
