"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/lib/navigation/routes";

interface DashboardEmptyStateProps {
  onCreateClick?: () => void;
}

export function DashboardEmptyState({ onCreateClick }: DashboardEmptyStateProps) {
  const action = onCreateClick ? (
    <button type="button" onClick={onCreateClick} className="submit-pill-btn">
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      Create First Assignment
    </button>
  ) : (
    <Link href={ROUTES.createAssignment} className="submit-pill-btn">
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      Create First Assignment
    </Link>
  );

  return (
    <EmptyState
      icon={FileText}
      title="No assignments yet"
      description="Upload material and generate your first assessment in minutes."
      action={action}
      className="max-w-none"
    />
  );
}
