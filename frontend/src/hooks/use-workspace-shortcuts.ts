"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/navigation/routes";
import { useWorkspaceStore } from "@/store/workspace.store";

interface WorkspaceShortcutsOptions {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  visibleAssignmentIds: string[];
  onExportPdf?: () => void;
}

export function useWorkspaceShortcuts({
  searchInputRef,
  visibleAssignmentIds,
  onExportPdf,
}: WorkspaceShortcutsOptions): void {
  const router = useRouter();
  const selectionMode = useWorkspaceStore((state) => state.selectionMode);
  const selectedIds = useWorkspaceStore((state) => state.selectedIds);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);
  const selectOnly = useWorkspaceStore((state) => state.selectOnly);
  const setSelectionMode = useWorkspaceStore((state) => state.setSelectionMode);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (event.key === "Escape") {
        clearSelection();
        setSelectionMode(false);
        return;
      }

      if (isTyping) return;

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        router.push(ROUTES.createAssignment);
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        onExportPdf?.();
        return;
      }

      if (!selectionMode && visibleAssignmentIds.length === 0) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const currentIndex = selectedIds[0]
          ? visibleAssignmentIds.indexOf(selectedIds[0])
          : -1;
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = Math.min(
          visibleAssignmentIds.length - 1,
          Math.max(0, currentIndex + delta),
        );
        selectOnly(visibleAssignmentIds[nextIndex]);
        setSelectionMode(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    clearSelection,
    onExportPdf,
    router,
    searchInputRef,
    selectOnly,
    selectedIds,
    selectionMode,
    setSelectionMode,
    visibleAssignmentIds,
  ]);
}
