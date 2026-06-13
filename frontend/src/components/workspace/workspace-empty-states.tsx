"use client";

import Link from "next/link";
import { Plus, SearchX, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ROUTES } from "@/lib/navigation/routes";

interface WorkspaceEmptyStateProps {
  onCreateClick?: () => void;
}

export function WorkspaceEmptyState({ onCreateClick }: WorkspaceEmptyStateProps) {
  const action = onCreateClick ? (
    <button type="button" onClick={onCreateClick} className="submit-pill-btn">
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      Create Assignment
    </button>
  ) : (
    <Link href={ROUTES.createAssignment} className="submit-pill-btn">
      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      Create Assignment
    </Link>
  );

  return (
    <EmptyState
      icon={Sparkles}
      title="Your workspace is empty"
      description="Create your first AI-generated assessment to get started."
      action={action}
    />
  );
}

export function WorkspaceFilteredEmptyState({
  onCreateClick,
}: WorkspaceEmptyStateProps) {
  const action = onCreateClick ? (
    <button type="button" onClick={onCreateClick} className="outline-pill-btn">
      Create Assignment
    </button>
  ) : (
    <Link href={ROUTES.createAssignment} className="outline-pill-btn">
      Create Assignment
    </Link>
  );

  return (
    <EmptyState
      icon={SearchX}
      title="No matching assignments"
      description="Try adjusting your search or filters, or create a new assignment."
      action={action}
    />
  );
}
