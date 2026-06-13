"use client";

import { memo } from "react";
import { AssignmentCard } from "@/components/assignment/AssignmentCard";
import { AssignmentListSkeleton } from "@/components/assignment/assignment-card-skeleton";
import {
  WorkspaceEmptyState,
  WorkspaceFilteredEmptyState,
} from "@/components/workspace/workspace-empty-states";
import type { StatusFilter } from "@/lib/utils/assignment-filters";
import type { Assignment } from "@/types/assignment";

interface AssignmentListProps {
  assignments: Assignment[];
  loading: boolean;
  fetchError?: string | null;
  onRetry?: () => void;
  hasActiveFilters?: boolean;
  totalCount?: number;
  statusFilter?: StatusFilter;
  recentlyOpenedId?: string | null;
  selectedIds?: string[];
  selectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPressSelect?: (id: string) => void;
  onCreateClick?: () => void;
}

function AssignmentListComponent({
  assignments,
  loading,
  fetchError = null,
  onRetry,
  hasActiveFilters = false,
  totalCount = 0,
  onCreateClick,
  recentlyOpenedId = null,
  selectedIds = [],
  selectionMode = false,
  onToggleSelect,
  onLongPressSelect,
}: AssignmentListProps) {
  if (loading) {
    return <AssignmentListSkeleton />;
  }

  if (fetchError) {
    return (
      <div className="product-state-card app-card mx-auto max-w-xl px-6 py-8 text-center">
        <h3 className="section-card__title">Couldn&apos;t load assignments</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          {fetchError}
        </p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="submit-pill-btn mt-5">
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (totalCount === 0) {
    return <WorkspaceEmptyState onCreateClick={onCreateClick} />;
  }

  if (assignments.length === 0 && hasActiveFilters) {
    return <WorkspaceFilteredEmptyState onCreateClick={onCreateClick} />;
  }

  return (
    <div className="workspace-assignment-list" data-virtualization-root>
      {assignments.map((assignment, index) => (
        <AssignmentCard
          key={assignment._id}
          assignment={assignment}
          index={index}
          isRecentlyOpened={recentlyOpenedId === assignment._id}
          isSelected={selectedIds.includes(assignment._id)}
          selectionMode={selectionMode}
          onToggleSelect={onToggleSelect}
          onLongPressSelect={onLongPressSelect}
        />
      ))}
    </div>
  );
}

export const AssignmentList = memo(AssignmentListComponent);
