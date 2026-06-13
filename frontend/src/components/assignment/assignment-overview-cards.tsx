"use client";

import {
  Calendar,
  Clock3,
  Hash,
  Layers,
  LayoutTemplate,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAssignmentTotalMarks } from "@/lib/utils/assignment-marks";
import { formatExamPatternLabel } from "@/lib/utils/assignment-insights";
import { estimateCompletionMinutes } from "@/lib/utils/assignment-status";
import { formatAssignmentDate } from "@/lib/utils/format-assignment";
import type { Assignment } from "@/types/assignment";

interface AssignmentOverviewCardsProps {
  assignment: Assignment;
}

interface OverviewCard {
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

function resolveExamPattern(assignment: Assignment): string {
  const pattern =
    assignment.examBlueprint?.examPattern ??
    assignment.questionConfig.examPattern;
  if (!pattern) return "Custom";
  return formatExamPatternLabel(pattern);
}

export function AssignmentOverviewCards({
  assignment,
}: AssignmentOverviewCardsProps) {
  const totalMarks = getAssignmentTotalMarks(assignment);
  const questionCount =
    assignment.examBlueprint?.totalQuestions ??
    assignment.questionConfig.numberOfQuestions;

  const cards: OverviewCard[] = [
    {
      label: "Exam Pattern",
      value: resolveExamPattern(assignment),
      icon: LayoutTemplate,
    },
    {
      label: "Difficulty",
      value: resolveDifficulty(assignment),
      icon: Sparkles,
    },
    {
      label: "Questions",
      value: String(questionCount),
      icon: Hash,
    },
    {
      label: "Marks",
      value: String(totalMarks),
      icon: Layers,
    },
    {
      label: "Est. Completion Time",
      value: `${estimateCompletionMinutes(assignment)} min`,
      icon: Clock3,
    },
    {
      label: "Created",
      value: formatAssignmentDate(assignment.createdAt, "long"),
      icon: Calendar,
    },
  ];

  return (
    <div className="assignment-overview-grid">
      {cards.map((card) => (
        <div key={card.label} className="metric-card">
          <div className="metric-card__icon">
            <card.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="metric-card__content">
            <span className="metric-card__value">{card.value}</span>
            <span className="metric-card__label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
