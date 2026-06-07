import { ASSIGNMENT_STATUS } from "@/lib/constants";
import { formatQuestionType } from "@/lib/utils/format-assignment";
import { hasGeneratedPaper, normalizeAssignmentStatus } from "@/lib/utils/assignment-status";
import type { Assignment } from "@/types/assignment";

export type StatusFilter =
  | "all"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export function matchesStatusFilter(
  assignment: Assignment,
  filter: StatusFilter,
): boolean {
  if (filter === "all") return true;

  const status = normalizeAssignmentStatus(assignment.status);

  if (filter === "pending") return status === ASSIGNMENT_STATUS.PENDING;
  if (filter === "processing") return status === ASSIGNMENT_STATUS.PROCESSING;
  if (filter === "failed") return status === ASSIGNMENT_STATUS.FAILED;

  return (
    status === ASSIGNMENT_STATUS.COMPLETED && hasGeneratedPaper(assignment)
  );
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
