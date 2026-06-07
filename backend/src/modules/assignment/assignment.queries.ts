import { Assignment } from "./assignment.model";
import type { AssignmentDocument } from "./assignment.model";

/** Exclude soft-deleted assignments from all active reads. */
export const NOT_DELETED_FILTER = {
  isDeleted: { $ne: true },
} as const;

export function isDeletedAssignment(
  assignment: Pick<AssignmentDocument, "isDeleted">,
): boolean {
  return assignment.isDeleted === true;
}

/** Active-read filter scoped to a single authenticated user. */
export function userScopedFilter(userId: string) {
  return {
    userId,
    ...NOT_DELETED_FILTER,
  };
}

export async function findActiveAssignmentById(
  id: string,
  userId: string,
): Promise<AssignmentDocument | null> {
  return Assignment.findOne({
    _id: id,
    ...userScopedFilter(userId),
  });
}

export async function findActiveAssignments(
  userId: string,
): Promise<AssignmentDocument[]> {
  return Assignment.find(userScopedFilter(userId)).sort({ createdAt: -1 });
}

export async function findActiveAssignmentsByIds(
  ids: string[],
  userId: string,
): Promise<AssignmentDocument[]> {
  return Assignment.find({
    _id: { $in: ids },
    ...userScopedFilter(userId),
  });
}

/**
 * Internal worker/queue lookup by assignment id only.
 * Not exposed through API — jobs are enqueued server-side with trusted ids.
 */
export async function findActiveAssignmentByIdInternal(
  id: string,
): Promise<AssignmentDocument | null> {
  return Assignment.findOne({
    _id: id,
    ...NOT_DELETED_FILTER,
  });
}
