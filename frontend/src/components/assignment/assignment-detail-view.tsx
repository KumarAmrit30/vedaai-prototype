"use client";

import { ArrowLeft, Calendar, ClipboardList, Clock3, Hash, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { AssignmentDetailTabs } from "@/components/assignment/assignment-detail-tabs";
import { getAssignmentMeta } from "@/lib/workspace/assignment-meta";
import { getAssignmentTotalMarks } from "@/lib/utils/assignment-marks";
import {
  estimateCompletionMinutes,
  getStatusBadgeModifier,
  getWorkspaceStatusDetail,
  getWorkspaceStatusLabel,
} from "@/lib/utils/assignment-status";
import {
  formatAssignmentDate,
  formatQuestionType,
} from "@/lib/utils/format-assignment";
import { ROUTES } from "@/lib/navigation/routes";
import type { Assignment } from "@/types/assignment";

interface AssignmentDetailViewProps {
  assignment: Assignment;
  onRegenerate?: () => void;
}

export function AssignmentDetailView({
  assignment,
  onRegenerate,
}: AssignmentDetailViewProps) {
  const meta = getAssignmentMeta(assignment._id);
  const statusDetail = getWorkspaceStatusDetail(assignment);
  const statusLabel = getWorkspaceStatusLabel(statusDetail);
  const totalMarks = getAssignmentTotalMarks(assignment);

  return (
    <div className="assignment-detail-view">
      <div className="assignment-detail-view__header mb-4">
        <Link href={ROUTES.assignments} className="assignment-detail-view__back">
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back to assignments
        </Link>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="section-title truncate">{assignment.title}</h1>
            <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
              {assignment.topic} · {formatQuestionType(assignment.questionConfig.questionType)}
            </p>
          </div>
          <span
            className={`status-badge status-badge--${getStatusBadgeModifier(statusDetail)} w-fit shrink-0`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="assignment-detail-view__layout">
        <aside className="assignment-detail-view__meta surface-card-compact lg:sticky lg:top-6">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
            Workspace overview
          </h2>

          <dl className="assignment-detail-view__meta-list">
            <div className="assignment-detail-view__meta-item">
              <dt>
                <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                Created
              </dt>
              <dd>{formatAssignmentDate(assignment.createdAt, "long")}</dd>
            </div>
            <div className="assignment-detail-view__meta-item">
              <dt>
                <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                Updated
              </dt>
              <dd>{formatAssignmentDate(assignment.updatedAt, "long")}</dd>
            </div>
            {meta.lastOpenedAt ? (
              <div className="assignment-detail-view__meta-item">
                <dt>
                  <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                  Last opened
                </dt>
                <dd>{formatAssignmentDate(meta.lastOpenedAt, "long")}</dd>
              </div>
            ) : null}
            <div className="assignment-detail-view__meta-item">
              <dt>
                <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
                Due date
              </dt>
              <dd>{formatAssignmentDate(assignment.dueDate, "long")}</dd>
            </div>
            <div className="assignment-detail-view__meta-item">
              <dt>
                <Hash className="h-3.5 w-3.5" strokeWidth={2} />
                Questions
              </dt>
              <dd>{assignment.questionConfig.numberOfQuestions}</dd>
            </div>
            <div className="assignment-detail-view__meta-item">
              <dt>
                <Layers className="h-3.5 w-3.5" strokeWidth={2} />
                Total marks
              </dt>
              <dd>{totalMarks}</dd>
            </div>
            <div className="assignment-detail-view__meta-item">
              <dt>
                <ClipboardList className="h-3.5 w-3.5" strokeWidth={2} />
                Question type
              </dt>
              <dd>{formatQuestionType(assignment.questionConfig.questionType)}</dd>
            </div>
            <div className="assignment-detail-view__meta-item">
              <dt>
                <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                Est. completion
              </dt>
              <dd>{estimateCompletionMinutes(assignment)} min</dd>
            </div>
            <div className="assignment-detail-view__meta-item">
              <dt>
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
                Generation source
              </dt>
              <dd>ExamForge AI · AI engine</dd>
            </div>
          </dl>

          <div className="assignment-detail-view__stats">
            <div>
              <span>Sections</span>
              <strong>{assignment.generatedPaper?.sections?.length ?? 0}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{statusLabel}</strong>
            </div>
          </div>
        </aside>

        <div className="assignment-detail-view__preview min-w-0">
          <AssignmentDetailTabs
            assignment={assignment}
            onRegenerate={onRegenerate}
          />
        </div>
      </div>
    </div>
  );
}
