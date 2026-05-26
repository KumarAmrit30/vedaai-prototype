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

export async function findActiveAssignmentById(
  id: string,
): Promise<AssignmentDocument | null> {
  return Assignment.findOne({
    _id: id,
    isDeleted: { $ne: true },
  });
}

export async function findActiveAssignments(): Promise<AssignmentDocument[]> {
  return Assignment.find({
    isDeleted: { $ne: true },
  }).sort({ createdAt: -1 });
}

export async function findActiveAssignmentsByIds(
  ids: string[],
): Promise<AssignmentDocument[]> {
  return Assignment.find({
    _id: { $in: ids },
    isDeleted: { $ne: true },
  });
}
