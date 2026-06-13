"use client";

import Link from "next/link";
import { memo } from "react";
import { FileText, Plus, SearchX } from "lucide-react";
import { AssignmentCard } from "@/components/assignment/AssignmentCard";
import { AssignmentListSkeleton } from "@/components/assignment/assignment-card-skeleton";
import { ROUTES } from "@/lib/navigation/routes";
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

function WorkspaceEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <div className="workspace-empty-state stitch-card">
      <div className="workspace-empty-state__illustration">
        <FileText className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-[20px] font-semibold text-[var(--text-primary)]">
        No assignments yet
      </h3>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-secondary)]">
        Upload material and generate your first assessment in minutes.
      </p>
      {onCreateClick ? (
        <button type="button" onClick={onCreateClick} className="submit-pill-btn mt-6">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create First Assignment
        </button>
      ) : (
        <Link href={ROUTES.createAssignment} className="submit-pill-btn mt-6">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create First Assignment
        </Link>
      )}
    </div>
  );
}

function WorkspaceFilteredEmptyState({
  onCreateClick,
}: {
  onCreateClick?: () => void;
}) {
  return (
    <div className="workspace-empty-state stitch-card">
      <div className="workspace-empty-state__illustration">
        <SearchX className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-[20px] font-semibold text-[var(--text-primary)]">
        No assignments found
      </h3>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--text-secondary)]">
        Create a new assignment or adjust your filters.
      </p>
      {onCreateClick ? (
        <button type="button" onClick={onCreateClick} className="submit-pill-btn mt-6">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create Assignment
        </button>
      ) : (
        <Link href={ROUTES.createAssignment} className="submit-pill-btn mt-6">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create Assignment
        </Link>
      )}
    </div>
  );
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
      <div className="product-state-card stitch-card mx-auto max-w-xl px-6 py-8 text-center">
        <h3 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
          Couldn&apos;t load assignments
        </h3>
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
