import { ASSIGNMENT_STATUSES, type AssignmentStatus } from "./assignment.types";

/** Coerce persisted/API status strings to a canonical lifecycle value. */
export function normalizeAssignmentStatus(status: string): AssignmentStatus {
  if ((ASSIGNMENT_STATUSES as readonly string[]).includes(status)) {
    return status as AssignmentStatus;
  }

  return "pending";
}
