import type { GeneratedPaper } from "../modules/assignment/assignment.types";
import type { AssignmentStatus } from "../modules/assignment/assignment.types";
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

function userRoom(userId: string): string {
  return `user:${userId}`;
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
  userId: string,
  assignmentId: string,
  progress: number,
): void {
  getIO()
    .to(userRoom(userId))
    .emit(
      "assignment:processing",
      buildPayload(assignmentId, "processing", progress),
    );
}

export function emitAssignmentCompleted(
  userId: string,
  assignmentId: string,
  generatedPaper: GeneratedPaper,
): void {
  getIO()
    .to(userRoom(userId))
    .emit(
      "assignment:completed",
      buildPayload(assignmentId, "completed", 100, { generatedPaper }),
    );
}

export function emitAssignmentFailed(
  userId: string,
  assignmentId: string,
  failureReason: string,
): void {
  getIO()
    .to(userRoom(userId))
    .emit(
      "assignment:failed",
      buildPayload(assignmentId, "failed", 0, { failureReason }),
    );
}

export function emitAssignmentUpdated(
  userId: string,
  payload: AssignmentUpdatedPayload,
): void {
  getIO().to(userRoom(userId)).emit("assignment:updated", payload);
}

export function emitAssignmentDeleted(
  userId: string,
  payload: AssignmentDeletedPayload,
): void {
  getIO().to(userRoom(userId)).emit("assignment:deleted", payload);
}
