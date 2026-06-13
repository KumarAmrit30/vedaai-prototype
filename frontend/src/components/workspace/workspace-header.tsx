"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { BulkActionBar } from "@/components/workspace/bulk-action-bar";
import { SortControl } from "@/components/workspace/sort-control";
import { PageHeader } from "@/components/ui/page-header";
import { ROUTES } from "@/lib/navigation/routes";
import type { SortOption } from "@/lib/workspace/sort-preference";

interface WorkspaceHeaderProps {
  totalCount: number;
  visibleCount: number;
  selectedCount: number;
  sortOption: SortOption;
  hasActiveFilters: boolean;
  searchQuery: string;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onSortChange: (option: SortOption) => void;
  onCreateClick?: () => void;
}

export function WorkspaceHeader({
  totalCount,
  visibleCount,
  selectedCount,
  sortOption,
  hasActiveFilters,
  searchQuery,
  searchInputRef,
  onSearchChange,
  onSortChange,
  onCreateClick,
}: WorkspaceHeaderProps) {
  const metaParts = [
    hasActiveFilters
      ? `Showing ${visibleCount} of ${totalCount}`
      : `${totalCount} assignment${totalCount === 1 ? "" : "s"} in workspace`,
    selectedCount > 0 ? `${selectedCount} selected` : null,
  ].filter(Boolean);

  return (
    <header className="workspace-header">
      <PageHeader
        title="Assignments"
        description="Manage, organize and export AI-generated assessments."
        meta={metaParts.join(" · ")}
        actions={
          onCreateClick ? (
            <button type="button" onClick={onCreateClick} className="submit-pill-btn">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Create Assignment
            </button>
          ) : (
            <Link href={ROUTES.createAssignment} className="submit-pill-btn">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Create Assignment
            </Link>
          )
        }
      />

      <div className="workspace-header__controls">
        <div className="workspace-search">
          <Search
            className="workspace-search__icon"
            strokeWidth={2}
            aria-hidden="true"
          />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search assignments, exams, materials..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search assignments"
            className="workspace-search__input form-input"
          />
        </div>
        <SortControl value={sortOption} onChange={onSortChange} />
      </div>

      <BulkActionBar />
    </header>
  );
}
