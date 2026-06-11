import {
  getAssignmentLimit,
  hasPlanFeature,
  type PlanFeatureKey,
} from "../billing/plan.config";
import { countInFlightAssignments } from "../assignment/assignment.queries";
import type { UserDocument } from "./user.model";

export interface GenerationEligibility {
  allowed: boolean;
  limit: number;
  /** Successful completed generations (usage counter — never incremented on create). */
  completedCount: number;
  /** Assignments currently pending or processing in the queue. */
  inFlightCount: number;
  /** completedCount + inFlightCount — the number compared against the plan limit. */
  effectiveCount: number;
}

/**
 * Single source of truth for "can this user start another generation?".
 *
 * The limit is enforced against completed + pending + processing assignments,
 * not the completed usage counter alone — otherwise a free user could enqueue
 * several jobs before any of them finish and exceed the plan cap.
 */
export async function checkGenerationEligibility(
  user: UserDocument,
): Promise<GenerationEligibility> {
  const limit = getAssignmentLimit(user.plan);
  const completedCount = user.usage.assignmentsGenerated;

  if (!hasPlanFeature(user.plan, "assignmentGeneration")) {
    return {
      allowed: false,
      limit,
      completedCount,
      inFlightCount: 0,
      effectiveCount: completedCount,
    };
  }

  // Unlimited plans never need the in-flight count query.
  if (!Number.isFinite(limit)) {
    return {
      allowed: true,
      limit,
      completedCount,
      inFlightCount: 0,
      effectiveCount: completedCount,
    };
  }

  const inFlightCount = await countInFlightAssignments(user.firebaseUid);
  const effectiveCount = completedCount + inFlightCount;

  return {
    allowed: effectiveCount < limit,
    limit,
    completedCount,
    inFlightCount,
    effectiveCount,
  };
}

/** Whether the user may start another assignment generation. */
export async function canGenerateAssignments(
  user: UserDocument,
): Promise<boolean> {
  const eligibility = await checkGenerationEligibility(user);
  return eligibility.allowed;
}

/** Whether the user's plan includes PDF export. */
export function canExportPdf(user: UserDocument): boolean {
  return canUseFeature(user, "pdfExport");
}

/** Whether the user's plan includes a specific feature flag. */
export function canUseFeature(
  user: UserDocument,
  feature: PlanFeatureKey,
): boolean {
  return hasPlanFeature(user.plan, feature);
}
