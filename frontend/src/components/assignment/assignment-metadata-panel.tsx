"use client";

import {
  Brain,
  Calendar,
  FileText,
  Hash,
  Layers,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAssignmentTotalMarks } from "@/lib/utils/assignment-marks";
import {
  formatExamPatternLabel,
  formatDurationMs,
} from "@/lib/utils/assignment-insights";
import { formatAssignmentDate, formatQuestionType } from "@/lib/utils/format-assignment";
import type { Assignment } from "@/types/assignment";

interface AssignmentMetadataPanelProps {
  assignment: Assignment;
}

interface MetadataCard {
  label: string;
  value: string;
  icon: LucideIcon;
}

function resolveDifficulty(assignment: Assignment): string {
  const level =
    assignment.examBlueprint?.difficultyLevel ??
    assignment.questionConfig.difficultyLevel;
  if (!level) return "Medium";
  return level.charAt(0) + level.slice(1).toLowerCase();
}

export function AssignmentMetadataPanel({
  assignment,
}: AssignmentMetadataPanelProps) {
  const totalMarks = getAssignmentTotalMarks(assignment);
  const pattern =
    assignment.examBlueprint?.examPattern ??
    assignment.questionConfig.examPattern;
  const aiModel =
    assignment.generationMetrics?.model ??
    assignment.generationMetrics?.provider ??
    "ExamForge AI";
  const sourceMaterial =
    assignment.materialSource?.fileName ??
    assignment.originalFileName ??
    "None attached";

  const cards: MetadataCard[] = [
    { label: "Subject", value: assignment.topic, icon: FileText },
    { label: "Difficulty", value: resolveDifficulty(assignment), icon: Sparkles },
    {
      label: "Exam Pattern",
      value: formatExamPatternLabel(pattern),
      icon: LayoutTemplate,
    },
    {
      label: "Question Count",
      value: String(assignment.questionConfig.numberOfQuestions),
      icon: Hash,
    },
    { label: "Marks", value: String(totalMarks), icon: Layers },
    { label: "AI Model", value: aiModel, icon: Brain },
    { label: "Source Material", value: sourceMaterial, icon: FileText },
    {
      label: "Question Style",
      value: formatQuestionType(assignment.questionConfig.questionType),
      icon: LayoutTemplate,
    },
    {
      label: "Created",
      value: formatAssignmentDate(assignment.createdAt, "long"),
      icon: Calendar,
    },
  ];

  const generationTime = formatDurationMs(
    assignment.generationMetrics?.durationMs,
  );

  return (
    <div className="metadata-panel">
      <div className="metadata-panel__grid">
        {cards.map((card) => (
          <article key={card.label} className="metadata-card">
            <div className="metadata-card__icon">
              <card.icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="metadata-card__label">{card.label}</p>
              <p className="metadata-card__value truncate">{card.value}</p>
            </div>
          </article>
        ))}
      </div>

      {generationTime ? (
        <p className="mt-4 text-[12px] text-[var(--text-muted)]">
          Generated in {generationTime}
        </p>
      ) : null}

      {assignment.instructions ? (
        <div className="stitch-card stitch-card--compact mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Instructions
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {assignment.instructions}
          </p>
        </div>
      ) : null}
    </div>
  );
}
