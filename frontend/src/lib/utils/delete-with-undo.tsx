import toast from "react-hot-toast";
import type { Assignment } from "@/types/assignment";

const UNDO_DURATION_MS = 5000;

export function deleteAssignmentsWithUndo(
  removed: Assignment[],
  onUndo: (restored: Assignment[]) => void,
  onCommit?: () => void | Promise<void>,
): void {
  if (removed.length === 0) return;

  const label =
    removed.length === 1
      ? `"${removed[0]?.title ?? "Assignment"}" removed`
      : `${removed.length} assignments removed`;

  let committed = false;

  console.log("[DELETE] Optimistic remove", {
    count: removed.length,
    ids: removed.map((item) => item._id),
  });

  toast(
    (t) => (
      <div className="flex items-center gap-3">
        <span>{label}</span>
        <button
          type="button"
          className="outline-pill-btn !px-3 !py-1.5 text-[11px]"
          onClick={() => {
            committed = true;
            console.log("[DELETE] Undo triggered", {
              ids: removed.map((item) => item._id),
            });
            onUndo(removed);
            toast.dismiss(t.id);
            toast.success("Assignment restored.");
          }}
        >
          Undo
        </button>
      </div>
    ),
    { duration: UNDO_DURATION_MS },
  );

  window.setTimeout(() => {
    if (committed) return;

    void (async () => {
      console.log("[DELETE] Commit started", {
        ids: removed.map((item) => item._id),
      });

      try {
        await onCommit?.();
        console.log("[DELETE] API success", {
          ids: removed.map((item) => item._id),
        });
      } catch (error) {
        console.error("[DELETE] API failure — rolling back", error);
        onUndo(removed);
        toast.error("Failed to delete assignment. Changes were restored.");
      }
    })();
  }, UNDO_DURATION_MS + 50);
}
