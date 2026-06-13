import { ASSIGNMENT_STATUS } from "@/lib/constants";
import {
  hasGeneratedPaper,
  normalizeAssignmentStatus,
} from "@/lib/utils/assignment-status";
import { formatExamPatternLabel } from "@/lib/utils/assignment-insights";
import type { UserPlan } from "@/store/user.store";
import type { SubscriptionStatus } from "@/types/billing";
import type { Assignment } from "@/types/assignment";

export interface AssignmentStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface UsageAnalytics {
  assignmentsGenerated: number;
  assignmentLimit: number | null;
  remainingGenerations: number | null;
}

export interface PlanAnalytics {
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
}

export interface DashboardMetrics {
  assignmentsGenerated: number;
  questionsGenerated: number;
  pdfExports: number;
  remainingCredits: number | null;
}

export interface WorkspaceStats {
  total: number;
  generatedThisMonth: number;
  drafts: number;
  completed: number;
}

export type ActivityEventType =
  | "exam_generated"
  | "pdf_ready"
  | "material_uploaded"
  | "draft_created"
  | "generation_failed";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  title: string;
  subtitle: string;
  timestamp: string;
}

export function computeAssignmentStatistics(
  assignments: Assignment[],
): AssignmentStatistics {
  const safeAssignments = Array.isArray(assignments) ? assignments : [];

  return safeAssignments.reduce<AssignmentStatistics>(
    (stats, assignment) => {
      stats.total += 1;

      const status = normalizeAssignmentStatus(assignment.status);

      switch (status) {
        case ASSIGNMENT_STATUS.PROCESSING:
          stats.processing += 1;
          break;
        case ASSIGNMENT_STATUS.COMPLETED:
          stats.completed += 1;
          break;
        case ASSIGNMENT_STATUS.FAILED:
          stats.failed += 1;
          break;
        case ASSIGNMENT_STATUS.PENDING:
        default:
          stats.pending += 1;
          break;
      }

      return stats;
    },
    {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    },
  );
}

export function computeUsageAnalytics(input: {
  assignmentsGenerated: number;
  assignmentsAllowed: number | null;
}): UsageAnalytics {
  const assignmentsGenerated = Math.max(0, input.assignmentsGenerated);
  const assignmentLimit = input.assignmentsAllowed;

  if (assignmentLimit === null) {
    return {
      assignmentsGenerated,
      assignmentLimit: null,
      remainingGenerations: null,
    };
  }

  return {
    assignmentsGenerated,
    assignmentLimit,
    remainingGenerations: Math.max(0, assignmentLimit - assignmentsGenerated),
  };
}

export function computePlanAnalytics(input: {
  plan?: UserPlan;
  subscriptionStatus?: SubscriptionStatus;
}): PlanAnalytics {
  return {
    plan: input.plan ?? "free",
    subscriptionStatus: input.subscriptionStatus ?? "inactive",
  };
}

export function countQuestionsGenerated(assignments: Assignment[]): number {
  return assignments.reduce((total, assignment) => {
    if (!hasGeneratedPaper(assignment)) return total;
    return total + (assignment.questionConfig.numberOfQuestions ?? 0);
  }, 0);
}

export function computeDashboardMetrics(
  assignments: Assignment[],
  usage: UsageAnalytics,
): DashboardMetrics {
  const completedWithPaper = assignments.filter(hasGeneratedPaper);

  return {
    assignmentsGenerated: usage.assignmentsGenerated,
    questionsGenerated: countQuestionsGenerated(assignments),
    pdfExports: completedWithPaper.length,
    remainingCredits: usage.remainingGenerations,
  };
}

export function computeWorkspaceStats(assignments: Assignment[]): WorkspaceStats {
  const stats = computeAssignmentStatistics(assignments);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const generatedThisMonth = assignments.filter((assignment) => {
    const created = new Date(assignment.createdAt);
    return created >= monthStart && hasGeneratedPaper(assignment);
  }).length;

  return {
    total: stats.total,
    generatedThisMonth,
    drafts: stats.pending,
    completed: stats.completed,
  };
}

function activityLabel(type: ActivityEventType): string {
  switch (type) {
    case "exam_generated":
      return "Exam Generated";
    case "pdf_ready":
      return "PDF Ready";
    case "material_uploaded":
      return "Material Uploaded";
    case "draft_created":
      return "Draft Created";
    case "generation_failed":
      return "Generation Failed";
    default:
      return "Activity";
  }
}

export function buildActivityTimeline(
  assignments: Assignment[],
  limit = 8,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const assignment of assignments) {
    const status = normalizeAssignmentStatus(assignment.status);
    const fileName =
      assignment.materialSource?.fileName ?? assignment.originalFileName;

    if (fileName) {
      events.push({
        id: `${assignment._id}-material`,
        type: "material_uploaded",
        title: activityLabel("material_uploaded"),
        subtitle: fileName,
        timestamp: assignment.createdAt,
      });
    }

    if (status === ASSIGNMENT_STATUS.PENDING) {
      events.push({
        id: `${assignment._id}-draft`,
        type: "draft_created",
        title: activityLabel("draft_created"),
        subtitle: assignment.title,
        timestamp: assignment.createdAt,
      });
    }

    if (status === ASSIGNMENT_STATUS.FAILED) {
      events.push({
        id: `${assignment._id}-failed`,
        type: "generation_failed",
        title: activityLabel("generation_failed"),
        subtitle: assignment.title,
        timestamp: assignment.updatedAt,
      });
    }

    if (hasGeneratedPaper(assignment)) {
      const pattern =
        assignment.examBlueprint?.examPattern ??
        assignment.questionConfig.examPattern;

      events.push({
        id: `${assignment._id}-generated`,
        type: "exam_generated",
        title: activityLabel("exam_generated"),
        subtitle: `${assignment.title}${pattern ? ` · ${formatExamPatternLabel(pattern)}` : ""}`,
        timestamp: assignment.updatedAt,
      });

      events.push({
        id: `${assignment._id}-pdf`,
        type: "pdf_ready",
        title: activityLabel("pdf_ready"),
        subtitle: assignment.title,
        timestamp: assignment.updatedAt,
      });
    }
  }

  return events
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, limit);
}

export function getRecentAssignments(
  assignments: Assignment[],
  limit = 5,
): Assignment[] {
  return [...assignments]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, limit);
}
