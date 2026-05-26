"use client";

import type { StatusFilter } from "@/lib/utils/assignment-filters";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
];

interface AssignmentFiltersProps {
  searchQuery: string;
  statusFilter: StatusFilter;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

export function AssignmentFilters({
  searchQuery,
  statusFilter,
  searchInputRef,
  onSearchChange,
  onStatusFilterChange,
}: AssignmentFiltersProps) {
  return (
    <div className="dashboard-filters">
      <div className="dashboard-filters__search">
        <input
          ref={searchInputRef}
          type="search"
          placeholder="Search title, topic, type..."
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label="Search assignments"
          className="form-input w-full py-2 text-xs"
        />
      </div>
      <div className="dashboard-filters__pills scrollbar-hide">
        <div className="dashboard-filters__pills-inner">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onStatusFilterChange(filter.id)}
              className={`filter-pill shrink-0${
                statusFilter === filter.id ? " filter-pill--active" : ""
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { STATUS_FILTERS };
