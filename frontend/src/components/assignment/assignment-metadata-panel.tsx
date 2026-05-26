"use client";

import type { Assignment } from "@/types/assignment";
import { formatAssignmentDate } from "@/lib/utils/format-assignment";
import {
  estimateCompletionMinutes,
  getWorkspaceStatusDetail,
  getWorkspaceStatusLabel,
} from "@/lib/utils/assignment-status";

interface AssignmentMetadataPanelProps {
  assignment: Assignment;
}

function formatMaterialFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssignmentMetadataPanel({
  assignment,
}: AssignmentMetadataPanelProps) {
  const statusDetail = getWorkspaceStatusDetail(assignment);
  const totalMarks =
    assignment.questionConfig.numberOfQuestions *
    assignment.questionConfig.marksPerQuestion;

  return (
    <div className="assignment-metadata-panel">
      <dl className="assignment-metadata-panel__grid">
        <div>
          <dt>Status</dt>
          <dd>{getWorkspaceStatusLabel(statusDetail)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatAssignmentDate(assignment.createdAt, "long")}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatAssignmentDate(assignment.updatedAt, "long")}</dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd>{formatAssignmentDate(assignment.dueDate, "long")}</dd>
        </div>
        <div>
          <dt>Topic</dt>
          <dd>{assignment.topic}</dd>
        </div>
        <div>
          <dt>Question type</dt>
          <dd>{assignment.questionConfig.questionType}</dd>
        </div>
        <div>
          <dt>Questions</dt>
          <dd>{assignment.questionConfig.numberOfQuestions}</dd>
        </div>
        <div>
          <dt>Marks per question</dt>
          <dd>{assignment.questionConfig.marksPerQuestion}</dd>
        </div>
        <div>
          <dt>Total marks</dt>
          <dd>{totalMarks}</dd>
        </div>
        <div>
          <dt>Est. completion time</dt>
          <dd>{estimateCompletionMinutes(assignment)} min</dd>
        </div>
        <div>
          <dt>Generation source</dt>
          <dd>VedaAI · Gemini assessment engine</dd>
        </div>
        {assignment.materialSource || assignment.originalFileName ? (
          <>
            <div>
              <dt>Uploaded material</dt>
              <dd>
                {assignment.materialSource?.fileName ??
                  assignment.originalFileName}
              </dd>
            </div>
            <div>
              <dt>Material type</dt>
              <dd>
                {(
                  assignment.materialSource?.fileType ??
                  assignment.materialSourceType ??
                  "file"
                ).toUpperCase()}
              </dd>
            </div>
            {assignment.materialSource?.fileSize ? (
              <div>
                <dt>Material size</dt>
                <dd>
                  {formatMaterialFileSize(assignment.materialSource.fileSize)}
                </dd>
              </div>
            ) : null}
            {assignment.materialSource?.charCount ? (
              <div>
                <dt>Extracted characters</dt>
                <dd>{assignment.materialSource.charCount.toLocaleString()}</dd>
              </div>
            ) : null}
          </>
        ) : (
          <div>
            <dt>Uploaded material</dt>
            <dd>No source file attached</dd>
          </div>
        )}
        <div>
          <dt>Sections generated</dt>
          <dd>{assignment.generatedPaper?.sections?.length ?? 0}</dd>
        </div>
      </dl>

      {assignment.instructions ? (
        <div className="assignment-metadata-panel__instructions">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Instructions
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {assignment.instructions}
          </p>
        </div>
      ) : null}
    </div>
  );
}
