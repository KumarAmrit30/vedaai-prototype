"use client";

import { ChevronDown } from "lucide-react";
import {
  SORT_OPTIONS,
  type SortOption,
} from "@/lib/workspace/sort-preference";

interface SortControlProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <>
      <div className="workspace-sort-control hidden md:block">
        <label htmlFor="assignment-sort" className="sr-only">
          Sort assignments
        </label>
        <div className="relative">
          <select
            id="assignment-sort"
            value={value}
            onChange={(event) => onChange(event.target.value as SortOption)}
            className="workspace-sort-control__select form-input form-select py-2 pl-3 pr-9 text-xs"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)] opacity-60" />
        </div>
      </div>

      <div className="workspace-sort-pills scrollbar-hide md:hidden">
        <div className="workspace-sort-pills__inner">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`filter-pill shrink-0${
                value === option.id ? " filter-pill--active" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
