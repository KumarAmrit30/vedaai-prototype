"use client";

import Link from "next/link";
import { memo } from "react";
import { CheckCircle2, Clock3, FileText, Plus, SearchX } from "lucide-react";
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
}

function AssignmentListComponent({
  assignments,
  loading,
  fetchError = null,
  onRetry,
  hasActiveFilters = false,
  totalCount = 0,
  statusFilter = "all",
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
      <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
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
    return (
      <div className="empty-state-card surface-card-compact mx-auto">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[18px] border border-[var(--border-light)] bg-[var(--surface-muted)]">
          <FileText
            className="h-6 w-6 text-[var(--text-secondary)] opacity-50"
            strokeWidth={1.75}
          />
        </div>
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
          No assignments yet
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
          Create your first AI-generated assessment to get started.
        </p>
        <Link href={ROUTES.createAssignment} className="submit-pill-btn mt-5">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Create Assignment
        </Link>
      </div>
    );
  }

  if (assignments.length === 0 && hasActiveFilters) {
    if (statusFilter === "completed") {
      return (
        <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-[var(--text-muted)] opacity-60" strokeWidth={1.75} />
          <h3 className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">
            No completed assignments
          </h3>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
            Generate an assignment to see completed papers here.
          </p>
          <Link href={ROUTES.createAssignment} className="submit-pill-btn mt-5">
            Create Assignment
          </Link>
        </div>
      );
    }

    if (statusFilter === "pending") {
      return (
        <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
          <Clock3 className="mx-auto h-8 w-8 text-[var(--text-muted)] opacity-60" strokeWidth={1.75} />
          <h3 className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">
            No pending assignments
          </h3>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
            Newly created assignments waiting to start will appear here.
          </p>
        </div>
      );
    }

    if (statusFilter === "processing") {
      return (
        <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
          <Clock3 className="mx-auto h-8 w-8 text-[var(--text-muted)] opacity-60" strokeWidth={1.75} />
          <h3 className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">
            No processing assignments
          </h3>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
            Assignments currently being generated will appear here.
          </p>
        </div>
      );
    }

    if (statusFilter === "failed") {
      return (
        <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
          <SearchX className="mx-auto h-8 w-8 text-[var(--text-muted)] opacity-60" strokeWidth={1.75} />
          <h3 className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">
            No failed assignments
          </h3>
          <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
            Failed generation attempts will appear here for review.
          </p>
        </div>
      );
    }

    return (
      <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
        <SearchX className="mx-auto h-8 w-8 text-[var(--text-muted)] opacity-60" strokeWidth={1.75} />
        <h3 className="mt-3 text-[15px] font-semibold text-[var(--text-primary)]">
          No matching assignments
        </h3>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Try a different search term or switch filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div
      className="assignment-list-container grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      data-virtualization-root
    >
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
