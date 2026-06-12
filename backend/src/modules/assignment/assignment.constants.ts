import { NOT_DELETED_FILTER } from "./assignment.queries";

/** @deprecated Use NOT_DELETED_FILTER from assignment.queries.ts */
export const ACTIVE_ASSIGNMENT_FILTER = NOT_DELETED_FILTER;

export const QUESTION_TYPES = [
  "short_answer",
  "long_answer",
  "mixed",
  "mcq",
  // Existing frontend values (hyphenated) — preserved for compatibility
  "short-answer",
  "long-answer",
  "multiple-choice",
  "true-false",
] as const;

export const MANUAL_ASSIGNMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
] as const;

export type ManualAssignmentStatus =
  (typeof MANUAL_ASSIGNMENT_STATUSES)[number];
