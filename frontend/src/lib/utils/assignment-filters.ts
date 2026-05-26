import { deriveWorkspaceStatus } from "@/lib/utils/assignment-status";
import { formatQuestionType } from "@/lib/utils/format-assignment";
import type { Assignment } from "@/types/assignment";

export type StatusFilter = "all" | "pending" | "completed";

export function matchesStatusFilter(
  assignment: Assignment,
  filter: StatusFilter,
): boolean {
  if (filter === "all") return true;

  const workspaceStatus = deriveWorkspaceStatus(assignment);
  if (filter === "completed") return workspaceStatus === "completed";
  return workspaceStatus === "pending";
}

export function matchesSearchQuery(
  assignment: Assignment,
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const questionType = assignment.questionConfig.questionType.toLowerCase();
  const questionTypeLabel = formatQuestionType(
    assignment.questionConfig.questionType,
  ).toLowerCase();

  return (
    assignment.title.toLowerCase().includes(normalizedQuery) ||
    assignment.topic.toLowerCase().includes(normalizedQuery) ||
    questionType.includes(normalizedQuery) ||
    questionTypeLabel.includes(normalizedQuery)
  );
}

export function filterAssignments(
  assignments: Assignment[],
  query: string,
  statusFilter: StatusFilter,
): Assignment[] {
  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  return safeAssignments.filter(
    (assignment) =>
      assignment &&
      matchesSearchQuery(assignment, query) &&
      matchesStatusFilter(assignment, statusFilter),
  );
}
