"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useRef } from "react";
import { Calendar, Clock3, HelpCircle } from "lucide-react";
import { AssignmentCardMenu } from "@/components/assignment/assignment-card-menu";
import { ROUTES } from "@/lib/navigation/routes";
import {
  formatAssignmentDate,
  formatQuestionType,
} from "@/lib/utils/format-assignment";
import {
  getStatusBadgeModifier,
  getWorkspaceStatusDetail,
  getWorkspaceStatusLabel,
} from "@/lib/utils/assignment-status";
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

function statusBadgeClass(detail: ReturnType<typeof getWorkspaceStatusDetail>): string {
  return `status-badge status-badge--${getStatusBadgeModifier(detail)}`;
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
  const longPressTimerRef = useRef<number | null>(null);
  const detailHref = ROUTES.assignmentDetail(assignment._id);
  const statusDetail = getWorkspaceStatusDetail(assignment);
  const statusLabel = getWorkspaceStatusLabel(statusDetail);

  function clearLongPressTimer(): void {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function handleOpen(): void {
    markAssignmentOpened(assignment._id);
    useWorkspaceStore.getState().setRecentlyOpenedHighlightId(assignment._id);
    router.push(detailHref);
  }

  function handlePointerDown(): void {
    clearLongPressTimer();
    longPressTimerRef.current = window.setTimeout(() => {
      onLongPressSelect?.(assignment._id);
    }, 480);
  }

  return (
    <article
      className={`assignment-card flow-step-panel${
        isSelected ? " assignment-card--selected" : ""
      }${isRecentlyOpened ? " assignment-card--recent" : ""}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPressTimer}
      onPointerLeave={clearLongPressTimer}
      onPointerCancel={clearLongPressTimer}
    >
      <div className="assignment-card__top">
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

        <Link
          href={detailHref}
          onClick={() => markAssignmentOpened(assignment._id)}
          className="flex min-w-0 flex-1 items-start justify-between gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-primary)]/20 focus-visible:ring-offset-1"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="assignment-card__title truncate">{assignment.title}</h3>
              {isRecentlyOpened ? (
                <span className="assignment-card__recent-hint">Recently opened</span>
              ) : null}
            </div>
            <p className="assignment-card__meta truncate">
              {assignment.topic}
              <span className="mx-1.5 opacity-40">·</span>
              {formatQuestionType(assignment.questionConfig.questionType)}
            </p>
          </div>
          <span className={statusBadgeClass(statusDetail)}>{statusLabel}</span>
        </Link>
      </div>

      <div className="assignment-card__footer">
        <button
          type="button"
          onClick={handleOpen}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-0.5 text-left"
        >
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Calendar className="h-3 w-3 shrink-0 opacity-50" strokeWidth={2} />
            {formatAssignmentDate(assignment.dueDate)}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <HelpCircle className="h-3 w-3 shrink-0 opacity-50" strokeWidth={2} />
            {assignment.questionConfig.numberOfQuestions} questions
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Clock3 className="h-3 w-3 shrink-0 opacity-50" strokeWidth={2} />
            Updated {formatAssignmentDate(assignment.updatedAt)}
          </span>
        </button>

        <AssignmentCardMenu assignment={assignment} />
      </div>
    </article>
  );
}

export const AssignmentCard = memo(AssignmentCardComponent);
