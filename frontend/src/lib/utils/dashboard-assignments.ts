import { getAllAssignmentMeta } from "@/lib/workspace/assignment-meta";
import { deriveWorkspaceStatus } from "@/lib/utils/assignment-status";
import type { Assignment } from "@/types/assignment";

export function getRecentlyOpenedAssignments(
  assignments: Assignment[],
  limit = 5,
): Assignment[] {
  const meta = getAllAssignmentMeta();

  return [...assignments]
    .filter((assignment) => meta[assignment._id]?.lastOpenedAt)
    .sort((a, b) => {
      const aTime = new Date(meta[a._id]?.lastOpenedAt ?? 0).getTime();
      const bTime = new Date(meta[b._id]?.lastOpenedAt ?? 0).getTime();
      return bTime - aTime;
    })
    .slice(0, limit);
}

export function getPendingAssignmentsSnapshot(
  assignments: Assignment[],
  limit = 4,
): Assignment[] {
  return assignments
    .filter((assignment) => deriveWorkspaceStatus(assignment) === "pending")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit);
}
