import { ASSIGNMENT_STATUS } from "@/lib/constants";
import type { Assignment, AssignmentStatus } from "@/types/assignment";

export type WorkspaceStatus = "pending" | "completed";

export type WorkspaceStatusDetail =
  | "processing"
  | "failed"
  | "draft"
  | "pending"
  | "completed"
  | "incomplete";

/** Legacy API/socket payloads may still send "generating". */
export function normalizeAssignmentStatus(status: string): AssignmentStatus {
  if (status === "generating") {
    return ASSIGNMENT_STATUS.PROCESSING;
  }

  if (
    (Object.values(ASSIGNMENT_STATUS) as string[]).includes(status)
  ) {
    return status as AssignmentStatus;
  }

  return ASSIGNMENT_STATUS.PENDING;
}

export function hasGeneratedPaper(assignment: Assignment): boolean {
  return Boolean(assignment.generatedPaper?.sections?.length);
}

export function deriveWorkspaceStatus(assignment: Assignment): WorkspaceStatus {
  if (
    assignment.status === ASSIGNMENT_STATUS.COMPLETED &&
    hasGeneratedPaper(assignment)
  ) {
    return "completed";
  }

  return "pending";
}

export function getWorkspaceStatusDetail(
  assignment: Assignment,
  isDraft = false,
): WorkspaceStatusDetail {
  const status = normalizeAssignmentStatus(assignment.status);

  if (isDraft) return "draft";
  if (status === ASSIGNMENT_STATUS.PROCESSING) return "processing";
  if (status === ASSIGNMENT_STATUS.FAILED) return "failed";
  if (
    status === ASSIGNMENT_STATUS.COMPLETED &&
    !hasGeneratedPaper(assignment)
  ) {
    return "incomplete";
  }
  if (deriveWorkspaceStatus(assignment) === "completed") return "completed";
  return "pending";
}

export function getWorkspaceStatusLabel(detail: WorkspaceStatusDetail): string {
  switch (detail) {
    case "processing":
      return "Processing";
    case "failed":
      return "Failed";
    case "draft":
      return "Draft";
    case "completed":
      return "Completed";
    case "incomplete":
      return "Incomplete";
    default:
      return "Pending";
  }
}

export function getStatusBadgeModifier(
  detail: WorkspaceStatusDetail,
): "pending" | "processing" | "completed" | "failed" {
  switch (detail) {
    case "processing":
      return "processing";
    case "failed":
      return "failed";
    case "completed":
      return "completed";
    default:
      return "pending";
  }
}

export function estimateCompletionMinutes(assignment: Assignment): number {
  const questions = assignment.questionConfig.numberOfQuestions;
  const base = 12;
  return Math.max(8, Math.round(base + questions * 1.5));
}
