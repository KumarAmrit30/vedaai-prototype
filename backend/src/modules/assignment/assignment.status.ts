import { ASSIGNMENT_STATUSES, type AssignmentStatus } from "./assignment.types";

/** Legacy documents may still store "generating" from earlier releases. */
export function normalizeAssignmentStatus(status: string): AssignmentStatus {
  if (status === "generating") {
    return "processing";
  }

  if ((ASSIGNMENT_STATUSES as readonly string[]).includes(status)) {
    return status as AssignmentStatus;
  }

  return "pending";
}
