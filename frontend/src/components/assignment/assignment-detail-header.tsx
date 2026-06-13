"use client";

import { Copy, Download, Loader2, Pencil } from "lucide-react";
import {
  getStatusBadgeModifier,
  getWorkspaceStatusDetail,
  getWorkspaceStatusLabel,
} from "@/lib/utils/assignment-status";
import type { Assignment } from "@/types/assignment";

interface AssignmentDetailHeaderProps {
  assignment: Assignment;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onExportPdf?: () => void;
  isExporting?: boolean;
}

export function AssignmentDetailHeader({
  assignment,
  onDuplicate,
  onEdit,
  onExportPdf,
  isExporting = false,
}: AssignmentDetailHeaderProps) {
  const statusDetail = getWorkspaceStatusDetail(assignment);
  const statusLabel = getWorkspaceStatusLabel(statusDetail);

  return (
    <header className="assignment-detail-header">
      <div className="assignment-detail-header__title-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-[32px]">
              {assignment.title}
            </h1>
            <span
              className={`status-badge status-badge--${getStatusBadgeModifier(statusDetail)} shrink-0`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            {assignment.topic}
          </p>
        </div>

        <div className="assignment-detail-header__actions">
          {onDuplicate ? (
            <button
              type="button"
              onClick={onDuplicate}
              className="outline-pill-btn"
            >
              <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              Duplicate
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" onClick={onEdit} className="outline-pill-btn">
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              Edit Exam
            </button>
          ) : null}
          {onExportPdf ? (
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isExporting}
              className="submit-pill-btn"
              aria-busy={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : (
                <Download className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              Export PDF
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
