"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AssignmentList } from "@/components/assignment/AssignmentList";
import { WorkspaceStatsSkeleton } from "@/components/assignment/assignment-card-skeleton";
import { AssignmentFilters } from "@/components/workspace/assignment-filters";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceStatsBar } from "@/components/workspace/workspace-stats-bar";
import { PageTransition } from "@/components/layout/page-transition";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useWorkspaceShortcuts } from "@/hooks/use-workspace-shortcuts";
import {
  filterAssignments,
  type StatusFilter,
} from "@/lib/utils/assignment-filters";
import { sortAssignments } from "@/lib/utils/assignment-sort";
import { computeWorkspaceStats } from "@/lib/utils/dashboard-analytics";
import { getMostRecentlyOpenedId } from "@/lib/workspace/assignment-meta";
import { useAssignmentStore } from "@/store/assignment.store";
import { useWorkspaceStore } from "@/store/workspace.store";

interface AssignmentWorkspaceProps {
  fetchError?: string | null;
  onRetry?: () => void;
  onCreateClick?: () => void;
}

export function AssignmentWorkspace({
  fetchError = null,
  onRetry,
  onCreateClick,
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

  const workspaceStats = useMemo(
    () => computeWorkspaceStats(assignments),
    [assignments],
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
      <section id="assignment-workspace" className="assignment-workspace space-y-4">
        {showWorkspaceChrome ? (
          <>
            <WorkspaceHeader
              totalCount={assignments.length}
              visibleCount={sortedAssignments.length}
              selectedCount={selectedIds.length}
              sortOption={sortOption}
              hasActiveFilters={hasActiveFilters}
              searchQuery={searchQuery}
              searchInputRef={searchInputRef}
              onSearchChange={setSearchQuery}
              onSortChange={setSortOption}
              onCreateClick={onCreateClick}
            />

            {loading && assignments.length > 0 ? (
              <WorkspaceStatsSkeleton />
            ) : !loading && assignments.length > 0 ? (
              <WorkspaceStatsBar stats={workspaceStats} />
            ) : null}

            <AssignmentFilters
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </>
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
            onCreateClick={onCreateClick}
          />
        </div>
      </section>
    </PageTransition>
  );
}
