import { ASSIGNMENT_STATUS } from "@/lib/constants";
import { normalizeAssignmentStatus } from "@/lib/utils/assignment-status";
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
