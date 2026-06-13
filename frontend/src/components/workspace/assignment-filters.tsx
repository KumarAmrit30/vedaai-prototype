"use client";

import type { StatusFilter } from "@/lib/utils/assignment-filters";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Draft" },
  { id: "processing", label: "Generating" },
  { id: "completed", label: "Completed" },
  { id: "failed", label: "Failed" },
];

interface AssignmentFiltersProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
}

export function AssignmentFilters({
  statusFilter,
  onStatusFilterChange,
}: AssignmentFiltersProps) {
  return (
    <div className="workspace-filter-bar">
      <div className="detail-tab-bar workspace-filter-bar__tabs">
        <div className="detail-tab-bar__inner">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onStatusFilterChange(filter.id)}
              className={`detail-tab${
                statusFilter === filter.id ? " detail-tab--active" : ""
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
