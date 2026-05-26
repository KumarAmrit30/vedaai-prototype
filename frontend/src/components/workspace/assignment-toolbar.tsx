"use client";

import { BulkActionBar } from "@/components/workspace/bulk-action-bar";
import { SortControl } from "@/components/workspace/sort-control";
import type { StatusFilter } from "@/lib/utils/assignment-filters";
import type { SortOption } from "@/lib/workspace/sort-preference";

interface AssignmentToolbarProps {
  totalCount: number;
  visibleCount: number;
  selectedCount: number;
  sortOption: SortOption;
  statusFilter: StatusFilter;
  hasActiveFilters: boolean;
  searchQuery: string;
  onSortChange: (option: SortOption) => void;
}

function filterSummary(
  statusFilter: StatusFilter,
  searchQuery: string,
): string | null {
  const parts: string[] = [];

  if (statusFilter !== "all") {
    parts.push(statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1));
  }

  if (searchQuery.trim()) {
    parts.push(`"${searchQuery.trim()}"`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

export function AssignmentToolbar({
  totalCount,
  visibleCount,
  selectedCount,
  sortOption,
  statusFilter,
  hasActiveFilters,
  searchQuery,
  onSortChange,
}: AssignmentToolbarProps) {
  const activeSummary = filterSummary(statusFilter, searchQuery);

  return (
    <div className="assignment-workspace-toolbar surface-card-compact">
      <div className="assignment-workspace-toolbar__primary">
        <div>
          <h2 className="section-title">Assignments</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
            {hasActiveFilters
              ? `Showing ${visibleCount} of ${totalCount}`
              : `${totalCount} assignment${totalCount === 1 ? "" : "s"} in workspace`}
            {selectedCount > 0
              ? ` · ${selectedCount} selected`
              : null}
          </p>
          {activeSummary ? (
            <p className="mt-1 text-[10px] font-medium text-[var(--orange-secondary)]">
              Active filters: {activeSummary}
            </p>
          ) : null}
        </div>

        <SortControl value={sortOption} onChange={onSortChange} />
      </div>

      <BulkActionBar />
    </div>
  );
}
