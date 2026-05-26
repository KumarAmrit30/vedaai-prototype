"use client";

import { Copy, Eye, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ROUTES } from "@/lib/navigation/routes";
import { persistAssignmentDeletes } from "@/lib/api/assignment-mutations";
import { deleteAssignmentsWithUndo } from "@/lib/utils/delete-with-undo";
import { storeDuplicateAssignment } from "@/lib/utils/duplicate-assignment";
import { removeAssignmentMeta } from "@/lib/workspace/assignment-meta";
import { useAssignmentStore } from "@/store/assignment.store";
import type { Assignment } from "@/types/assignment";

interface AssignmentCardMenuProps {
  assignment: Assignment;
}

export function AssignmentCardMenu({ assignment }: AssignmentCardMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const removeAssignmentsById = useAssignmentStore(
    (state) => state.removeAssignmentsById,
  );
  const restoreAssignments = useAssignmentStore((state) => state.restoreAssignments);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleView(): void {
    setOpen(false);
    router.push(ROUTES.assignmentDetail(assignment._id));
  }

  function handleDuplicate(): void {
    setOpen(false);
    storeDuplicateAssignment(assignment);
    toast.success("Assignment duplicated — review and generate when ready.");
    router.push(ROUTES.createAssignment);
  }

  function handleDeleteConfirm(): void {
    const removed = removeAssignmentsById([assignment._id]);
    removeAssignmentMeta(assignment._id);
    setConfirmDelete(false);
    setOpen(false);

    deleteAssignmentsWithUndo(
      removed,
      (restored) => {
        restoreAssignments(restored);
      },
      () => persistAssignmentDeletes([assignment._id]),
    );
  }

  return (
    <>
      <div ref={menuRef} className="assignment-card-menu">
        <button
          type="button"
          aria-label="Assignment options"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
          className="assignment-card__options-btn flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)]"
        >
          <MoreVertical className="h-3.5 w-3.5" strokeWidth={2} />
        </button>

        {open ? (
          <div className="assignment-card-menu__dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              className="assignment-card-menu__item"
              onClick={handleView}
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={2} />
              View Assignment
            </button>
            <button
              type="button"
              role="menuitem"
              className="assignment-card-menu__item"
              onClick={handleDuplicate}
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              Duplicate
            </button>
            <button
              type="button"
              role="menuitem"
              className="assignment-card-menu__item assignment-card-menu__item--danger"
              onClick={() => {
                setOpen(false);
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete assignment?"
        description="This removes the assignment from your dashboard. You'll have 5 seconds to undo."
        confirmLabel="Delete"
        cancelLabel="Keep assignment"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
