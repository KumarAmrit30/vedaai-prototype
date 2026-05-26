import { getAllAssignmentMeta } from "@/lib/workspace/assignment-meta";
import type { SortOption } from "@/lib/workspace/sort-preference";
import type { Assignment } from "@/types/assignment";

export function sortAssignments(
  assignments: Assignment[],
  sortOption: SortOption,
): Assignment[] {
  const meta = getAllAssignmentMeta();
  const sorted = [...assignments];

  switch (sortOption) {
    case "oldest":
      sorted.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      break;
    case "recently-opened":
      sorted.sort((a, b) => {
        const aOpened = meta[a._id]?.lastOpenedAt
          ? new Date(meta[a._id].lastOpenedAt!).getTime()
          : 0;
        const bOpened = meta[b._id]?.lastOpenedAt
          ? new Date(meta[b._id].lastOpenedAt!).getTime()
          : 0;
        if (bOpened !== aOpened) return bOpened - aOpened;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      break;
    case "alphabetical":
      sorted.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
      break;
    case "newest":
    default:
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      break;
  }

  return sorted;
}
