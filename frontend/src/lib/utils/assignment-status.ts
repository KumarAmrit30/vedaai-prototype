import { ASSIGNMENT_STATUS } from "@/lib/constants";
import type { Assignment } from "@/types/assignment";

export type WorkspaceStatus = "pending" | "completed";

export type WorkspaceStatusDetail =
  | "generating"
  | "failed"
  | "draft"
  | "pending"
  | "completed"
  | "incomplete";

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
  if (isDraft) return "draft";
  if (assignment.status === ASSIGNMENT_STATUS.GENERATING) return "generating";
  if (assignment.status === ASSIGNMENT_STATUS.FAILED) return "failed";
  if (
    assignment.status === ASSIGNMENT_STATUS.COMPLETED &&
    !hasGeneratedPaper(assignment)
  ) {
    return "incomplete";
  }
  if (deriveWorkspaceStatus(assignment) === "completed") return "completed";
  return "pending";
}

export function getWorkspaceStatusLabel(detail: WorkspaceStatusDetail): string {
  switch (detail) {
    case "generating":
      return "Generating";
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

export function estimateCompletionMinutes(assignment: Assignment): number {
  const questions = assignment.questionConfig.numberOfQuestions;
  const base = 12;
  return Math.max(8, Math.round(base + questions * 1.5));
}
