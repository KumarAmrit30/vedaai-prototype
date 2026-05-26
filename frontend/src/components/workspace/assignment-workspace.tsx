"use client";

import { AssignmentList } from "@/components/assignment/AssignmentList";
import { AssignmentFilters } from "@/components/workspace/assignment-filters";
import { AssignmentToolbar } from "@/components/workspace/assignment-toolbar";
import { PageTransition } from "@/components/layout/page-transition";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useWorkspaceShortcuts } from "@/hooks/use-workspace-shortcuts";
import {
  filterAssignments,
  type StatusFilter,
} from "@/lib/utils/assignment-filters";
import { sortAssignments } from "@/lib/utils/assignment-sort";
import { getMostRecentlyOpenedId } from "@/lib/workspace/assignment-meta";
import { useAssignmentStore } from "@/store/assignment.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import { useEffect, useMemo, useRef, useState } from "react";

interface AssignmentWorkspaceProps {
  fetchError?: string | null;
  onRetry?: () => void;
}

export function AssignmentWorkspace({
  fetchError = null,
  onRetry,
}: AssignmentWorkspaceProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const rawAssignments = useAssignmentStore((state) => state.assignments);
  const assignments = useMemo(
    () => rawAssignments ?? [],
    [rawAssignments],
  );
  const loading = useAssignmentStore((state) => state.loading);
  const loadedOnce = useAssignmentStore((state) => state.loadedOnce);

  const sortOption = useWorkspaceStore((state) => state.sortOption);
  const setSortOption = useWorkspaceStore((state) => state.setSortOption);
  const hydrateSortOption = useWorkspaceStore((state) => state.hydrateSortOption);
  const selectedIds = useWorkspaceStore((state) => state.selectedIds);
  const selectionMode = useWorkspaceStore((state) => state.selectionMode);
  const toggleSelected = useWorkspaceStore((state) => state.toggleSelected);
  const setSelectionMode = useWorkspaceStore((state) => state.setSelectionMode);
  const recentlyOpenedHighlightId = useWorkspaceStore(
    (state) => state.recentlyOpenedHighlightId,
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const debouncedSearch = useDebouncedValue(searchQuery, 180);

  useScrollRestore(".app-shell__workspace", "veda:assignments-scroll");

  useEffect(() => {
    hydrateSortOption();
  }, [hydrateSortOption]);

  const filteredAssignments = useMemo(
    () => filterAssignments(assignments, debouncedSearch, statusFilter),
    [assignments, debouncedSearch, statusFilter],
  );

  const sortedAssignments = useMemo(
    () => sortAssignments(filteredAssignments, sortOption),
    [filteredAssignments, sortOption],
  );

  const visibleAssignmentIds = useMemo(
    () => sortedAssignments.map((item) => item._id),
    [sortedAssignments],
  );

  const recentlyOpenedId = useMemo(() => {
    if (recentlyOpenedHighlightId) return recentlyOpenedHighlightId;
    if (sortOption !== "recently-opened") return null;
    return getMostRecentlyOpenedId(sortedAssignments.map((item) => item._id));
  }, [recentlyOpenedHighlightId, sortOption, sortedAssignments]);

  useWorkspaceShortcuts({
    searchInputRef,
    visibleAssignmentIds,
  });

  const hasActiveFilters =
    debouncedSearch.trim().length > 0 || statusFilter !== "all";
  const showWorkspaceChrome =
    loading || fetchError || assignments.length > 0 || loadedOnce;

  return (
    <PageTransition>
      <section id="assignment-workspace" className="assignment-workspace">
        {showWorkspaceChrome ? (
          <div className="assignment-workspace__controls space-y-3">
            <AssignmentToolbar
              totalCount={assignments.length}
              visibleCount={sortedAssignments.length}
              selectedCount={selectedIds.length}
              sortOption={sortOption}
              statusFilter={statusFilter}
              hasActiveFilters={hasActiveFilters}
              searchQuery={debouncedSearch}
              onSortChange={setSortOption}
            />

            <AssignmentFilters
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              searchInputRef={searchInputRef}
              onSearchChange={setSearchQuery}
              onStatusFilterChange={setStatusFilter}
            />
          </div>
        ) : null}

        <div
          className={
            !loading && !fetchError && assignments.length === 0
              ? "flex min-h-[calc(100vh-220px)] items-center justify-center py-6 md:min-h-[calc(100vh-180px)]"
              : "assignment-workspace__grid-wrap"
          }
        >
          <AssignmentList
            assignments={sortedAssignments}
            loading={loading}
            fetchError={fetchError}
            onRetry={onRetry}
            hasActiveFilters={hasActiveFilters}
            totalCount={assignments.length}
            statusFilter={statusFilter}
            recentlyOpenedId={recentlyOpenedId}
            selectedIds={selectedIds}
            selectionMode={selectionMode}
            onToggleSelect={toggleSelected}
            onLongPressSelect={(id) => {
              toggleSelected(id);
              setSelectionMode(true);
            }}
          />
        </div>
      </section>
    </PageTransition>
  );
}
