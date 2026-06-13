"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Calendar,
  Copy,
  Download,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { AssignmentCardMenu } from "@/components/assignment/assignment-card-menu";
import { ROUTES } from "@/lib/navigation/routes";
import { formatExamPatternLabel } from "@/lib/utils/assignment-insights";
import { getAssignmentTotalMarks } from "@/lib/utils/assignment-marks";
import { formatAssignmentDate } from "@/lib/utils/format-assignment";
import {
  getStatusBadgeModifier,
  getWorkspaceStatusDetail,
  getWorkspaceStatusLabel,
  hasGeneratedPaper,
} from "@/lib/utils/assignment-status";
import { exportAssignmentPdf } from "@/lib/utils/export-assignment-pdf";
import { storeDuplicateAssignment } from "@/lib/utils/duplicate-assignment";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { markAssignmentOpened } from "@/lib/workspace/assignment-meta";
import { useWorkspaceStore } from "@/store/workspace.store";
import type { Assignment } from "@/types/assignment";

interface AssignmentCardProps {
  assignment: Assignment;
  index?: number;
  isRecentlyOpened?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPressSelect?: (id: string) => void;
}

function resolveDifficulty(assignment: Assignment): string {
  const level =
    assignment.examBlueprint?.difficultyLevel ??
    assignment.questionConfig.difficultyLevel;
  if (!level) return "Medium";
  return level.charAt(0) + level.slice(1).toLowerCase();
}

function AssignmentCardComponent({
  assignment,
  index = 0,
  isRecentlyOpened = false,
  isSelected = false,
  selectionMode = false,
  onToggleSelect,
  onLongPressSelect,
}: AssignmentCardProps) {
  const router = useRouter();
  const requireAuth = useRequireAuth();
  const longPressTimerRef = useRef<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const detailHref = ROUTES.assignmentDetail(assignment._id);
  const statusDetail = getWorkspaceStatusDetail(assignment);
  const statusLabel = getWorkspaceStatusLabel(statusDetail);
  const pattern =
    assignment.examBlueprint?.examPattern ??
    assignment.questionConfig.examPattern;
  const totalMarks = getAssignmentTotalMarks(assignment);

  function clearLongPressTimer(): void {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function openDetail(): void {
    markAssignmentOpened(assignment._id);
    useWorkspaceStore.getState().setRecentlyOpenedHighlightId(assignment._id);
    router.push(detailHref);
  }

  function handleOpen(): void {
    requireAuth(openDetail, { next: detailHref });
  }

  function handleDuplicate(): void {
    storeDuplicateAssignment(assignment);
    toast.success("Assignment duplicated — review and generate when ready.");
    router.push(ROUTES.createAssignment);
  }

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

  function handlePointerDown(): void {
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      onLongPressSelect?.(assignment._id);
    }, 480);
  }

  return (
    <article
      className={`workspace-assignment-card${
        isSelected ? " workspace-assignment-card--selected" : ""
      }${isRecentlyOpened ? " workspace-assignment-card--recent" : ""}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPressTimer}
      onPointerLeave={clearLongPressTimer}
      onPointerCancel={clearLongPressTimer}
    >
      <div className="workspace-assignment-card__main">
        <label
          className={`assignment-card__checkbox${
            selectionMode ? " assignment-card__checkbox--visible" : ""
          }`}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(assignment._id)}
            aria-label={`Select ${assignment.title}`}
          />
        </label>

        <div className="min-w-0 flex-1">
          <div className="workspace-assignment-card__header">
            <div className="min-w-0 flex-1">
              <Link
                href={detailHref}
                onClick={(event) => {
                  event.preventDefault();
                  handleOpen();
                }}
                className="workspace-assignment-card__title"
              >
                {assignment.title}
              </Link>
              {isRecentlyOpened ? (
                <span className="assignment-card__recent-hint">Recently opened</span>
              ) : null}
              <p className="workspace-assignment-card__subject">{assignment.topic}</p>
            </div>
            <span
              className={`status-badge status-badge--${getStatusBadgeModifier(statusDetail)} shrink-0`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="workspace-assignment-card__meta">
            <span>{formatExamPatternLabel(pattern)}</span>
            <span className="workspace-assignment-card__dot" aria-hidden="true" />
            <span>{resolveDifficulty(assignment)}</span>
            <span className="workspace-assignment-card__dot" aria-hidden="true" />
            <span>{assignment.questionConfig.numberOfQuestions} questions</span>
            <span className="workspace-assignment-card__dot" aria-hidden="true" />
            <span>{totalMarks} marks</span>
            <span className="workspace-assignment-card__dot hidden sm:inline" aria-hidden="true" />
            <span className="hidden items-center gap-1 sm:inline-flex">
              <Calendar className="h-3 w-3 opacity-50" strokeWidth={2} />
              {formatAssignmentDate(assignment.createdAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="workspace-assignment-card__actions">
        <button type="button" onClick={handleOpen} className="workspace-action-btn">
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Open</span>
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          className="workspace-action-btn"
        >
          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Duplicate</span>
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
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        ) : null}
        <AssignmentCardMenu assignment={assignment} />
      </div>
    </article>
  );
}

export const AssignmentCard = memo(AssignmentCardComponent);
