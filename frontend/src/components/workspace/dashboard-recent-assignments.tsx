"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Copy, Download, ExternalLink, Loader2 } from "lucide-react";
import { formatExamPatternLabel } from "@/lib/utils/assignment-insights";
import { getAssignmentTotalMarks } from "@/lib/utils/assignment-marks";
import {
  getStatusBadgeModifier,
  getWorkspaceStatusDetail,
  getWorkspaceStatusLabel,
  hasGeneratedPaper,
} from "@/lib/utils/assignment-status";
import { exportAssignmentPdf } from "@/lib/utils/export-assignment-pdf";
import { storeDuplicateAssignment } from "@/lib/utils/duplicate-assignment";
import { ROUTES } from "@/lib/navigation/routes";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { Assignment } from "@/types/assignment";

interface DashboardRecentAssignmentsProps {
  assignments: Assignment[];
}

function resolveDifficulty(assignment: Assignment): string {
  const level =
    assignment.examBlueprint?.difficultyLevel ??
    assignment.questionConfig.difficultyLevel;
  if (!level) return "Medium";
  return level.charAt(0) + level.slice(1).toLowerCase();
}

function RecentAssignmentRow({ assignment }: { assignment: Assignment }) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const [isExporting, setIsExporting] = useState(false);

  const statusDetail = getWorkspaceStatusDetail(assignment);
  const pattern =
    assignment.examBlueprint?.examPattern ??
    assignment.questionConfig.examPattern;
  const totalMarks = getAssignmentTotalMarks(assignment);
  const detailHref = ROUTES.assignmentDetail(assignment._id);

  async function handleExport(): Promise<void> {
    if (isExporting || !hasGeneratedPaper(assignment)) return;
    if (!requireAuth()) return;

    setIsExporting(true);
    try {
      await exportAssignmentPdf(assignment);
      toast.success("PDF downloaded successfully.");
    } catch {
      toast.error("Unable to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleDuplicate(): void {
    storeDuplicateAssignment(assignment);
    toast.success("Opening create flow to duplicate this assignment.");
    router.push(ROUTES.createAssignment);
  }

  function handleOpen(): void {
    requireAuth(() => router.push(detailHref), { next: detailHref });
  }

  return (
    <article className="dashboard-recent-card">
      <div className="dashboard-recent-card__main">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={detailHref}
              className="font-display text-[15px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
            >
              {assignment.title}
            </Link>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              {formatExamPatternLabel(pattern)}
              <span className="mx-1.5 opacity-40">·</span>
              {assignment.questionConfig.numberOfQuestions} questions
              <span className="mx-1.5 opacity-40">·</span>
              {totalMarks} marks
              <span className="mx-1.5 opacity-40">·</span>
              {resolveDifficulty(assignment)}
            </p>
          </div>
          <span
            className={`status-badge status-badge--${getStatusBadgeModifier(statusDetail)} shrink-0`}
          >
            {getWorkspaceStatusLabel(statusDetail)}
          </span>
        </div>
      </div>

      <div className="dashboard-recent-card__actions">
        <button type="button" onClick={handleOpen} className="workspace-action-btn">
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          Open
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          className="workspace-action-btn"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          Duplicate
        </button>
        {hasGeneratedPaper(assignment) ? (
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="workspace-action-btn"
            aria-busy={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Download className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            Export
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function DashboardRecentAssignments({
  assignments,
}: DashboardRecentAssignmentsProps) {
  if (assignments.length === 0) return null;

  return (
    <section>
      <div className="dashboard-section-header">
        <h2 className="font-display text-[15px] font-semibold text-[var(--text-primary)]">
          Recent Assignments
        </h2>
        <Link href={ROUTES.assignments} className="dashboard-section-header__link">
          View all
        </Link>
      </div>
      <div className="dashboard-recent-list">
        {assignments.map((assignment) => (
          <RecentAssignmentRow key={assignment._id} assignment={assignment} />
        ))}
      </div>
    </section>
  );
}
