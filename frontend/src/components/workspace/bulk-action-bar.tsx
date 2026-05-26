"use client";

import { CheckSquare, Copy, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  bulkUpdateAssignmentStatus,
  persistAssignmentDeletes,
} from "@/lib/api/assignment-mutations";
import { ASSIGNMENT_STATUS } from "@/lib/constants";
import { ROUTES } from "@/lib/navigation/routes";
import { deleteAssignmentsWithUndo } from "@/lib/utils/delete-with-undo";
import { removeManyAssignmentMeta } from "@/lib/workspace/assignment-meta";
import { storeDuplicateAssignment } from "@/lib/utils/duplicate-assignment";
import { useAssignmentStore } from "@/store/assignment.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import type { Assignment } from "@/types/assignment";

export function BulkActionBar() {
  const router = useRouter();
  const selectedIds = useWorkspaceStore((state) => state.selectedIds);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);
  const removeAssignmentsById = useAssignmentStore(
    (state) => state.removeAssignmentsById,
  );
  const restoreAssignments = useAssignmentStore((state) => state.restoreAssignments);
  const updateAssignment = useAssignmentStore((state) => state.updateAssignment);
  const assignments = useAssignmentStore((state) => state.assignments);

  if (selectedIds.length === 0) return null;

  const selectedAssignments = assignments.filter((item) =>
    selectedIds.includes(item._id),
  );

  function handleDelete(): void {
    const ids = [...selectedIds];

    const removed = removeAssignmentsById(ids);
    clearSelection();
    removeManyAssignmentMeta(ids);

    deleteAssignmentsWithUndo(
      removed,
      (restoredItems) => {
        restoreAssignments(restoredItems);
      },
      () => persistAssignmentDeletes(ids),
    );
  }

  async function handleMarkCompleted(): Promise<void> {
    const ids = [...selectedIds];
    const snapshots = ids
      .map((id) => assignments.find((item) => item._id === id))
      .filter((item): item is Assignment => Boolean(item));

    snapshots.forEach((assignment) => {
      updateAssignment(assignment._id, {
        status: ASSIGNMENT_STATUS.COMPLETED,
        generatedPaper: assignment.generatedPaper ?? { sections: [] },
      });
    });

    clearSelection();

    try {
      await bulkUpdateAssignmentStatus(ids, "completed");
      toast.success(
        `${ids.length} assignment${ids.length === 1 ? "" : "s"} marked completed.`,
      );
    } catch {
      snapshots.forEach((assignment) => {
        updateAssignment(assignment._id, {
          status: assignment.status,
          generatedPaper: assignment.generatedPaper,
        });
      });
      toast.error("Failed to update assignments. Changes were restored.");
    }
  }

  function handleDuplicate(): void {
    const first = selectedAssignments[0];
    if (!first) return;

    storeDuplicateAssignment(first);
    toast.success(
      selectedIds.length > 1
        ? "Duplicated first selected assignment to create flow."
        : "Assignment duplicated to create flow.",
    );
    clearSelection();
    router.push(ROUTES.createAssignment);
  }

  return (
    <div className="bulk-action-bar surface-card-compact">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-[var(--orange-primary)]" strokeWidth={2} />
        <span className="text-[12px] font-medium text-[var(--text-primary)]">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleMarkCompleted()}
          className="outline-pill-btn !px-3 !py-1.5 text-[11px]"
        >
          Mark completed
        </button>
        <button type="button" onClick={handleDuplicate} className="outline-pill-btn !px-3 !py-1.5 text-[11px]">
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          Duplicate
        </button>
        <button type="button" onClick={handleDelete} className="outline-pill-btn !px-3 !py-1.5 text-[11px]">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          Delete
        </button>
        <button
          type="button"
          onClick={clearSelection}
          aria-label="Clear selection"
          className="assignment-card__options-btn flex h-7 w-7 items-center justify-center rounded-full"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
