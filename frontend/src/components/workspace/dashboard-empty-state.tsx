"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { ROUTES } from "@/lib/navigation/routes";

interface DashboardEmptyStateProps {
  onCreateClick?: () => void;
}

export function DashboardEmptyState({ onCreateClick }: DashboardEmptyStateProps) {
  return (
    <section className="dashboard-empty-state stitch-card">
      <div className="dashboard-empty-state__illustration">
        <FileText className="h-8 w-8 text-[var(--text-muted)]" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-[18px] font-semibold text-[var(--text-primary)]">
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
    </section>
  );
}
