import { logInfo, logWarn } from "../../utils/logger";
import { Assignment } from "./assignment.model";
import { buildStuckAssignmentFilter } from "./assignment.queries";

export interface StaleAssignmentRecoveryResult {
  recoveredCount: number;
}

export async function recoverStaleAssignments(): Promise<StaleAssignmentRecoveryResult> {
  const staleAssignments = await Assignment.find(buildStuckAssignmentFilter());

  let recoveredCount = 0;

  for (const assignment of staleAssignments) {
    assignment.status = "failed";
    assignment.failureReason = "Assignment generation timed out";
    assignment.completedAt = new Date();
    assignment.generationMetrics = {
      ...assignment.generationMetrics,
      errorCategory: "timeout",
    };
    await assignment.save();

    logWarn("[RECOVERY] Recovered stale assignment", {
      assignmentId: String(assignment._id),
      userId: assignment.userId,
      startedAt: assignment.startedAt,
    });

    recoveredCount++;
  }

  logInfo("[RECOVERY] Stale assignment scan completed", {
    recoveredCount,
  });

  return { recoveredCount };
}
