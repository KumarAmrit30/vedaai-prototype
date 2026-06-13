/** Shared copy for generation usage — always "lifetime" (no monthly reset implied). */

export function formatSidebarUsageLabel(
  generationsUsed: number,
  generationsAllowed: number | null,
  isAuthenticated: boolean,
): string {
  if (!isAuthenticated) return "Sign in to start generating";
  if (generationsAllowed === null) {
    return `${generationsUsed} Lifetime Generations Used`;
  }
  return `${generationsUsed} / ${generationsAllowed} Lifetime Generations Used`;
}

export function formatSettingsUsageLabel(
  generationsUsed: number,
  generationsAllowed: number | null,
): string {
  if (generationsAllowed === null) return String(generationsUsed);
  return `${generationsUsed} / ${generationsAllowed} lifetime`;
}

export function formatDashboardUsageLabel(
  assignmentsGenerated: number,
  assignmentLimit: number | null,
): string {
  if (assignmentLimit === null) {
    return `${assignmentsGenerated} lifetime assignments generated`;
  }
  return `${assignmentsGenerated} of ${assignmentLimit} lifetime generations used`;
}

export function formatUpgradeLimitMessage(
  used: number,
  limit: number | null | undefined,
): string {
  if (limit == null) {
    return `You have used ${used} lifetime assignment generation${used === 1 ? "" : "s"} on your current plan.`;
  }
  return `You have used ${used} of ${limit} lifetime assignment generation${limit === 1 ? "" : "s"} included in your plan.`;
}

export function formatPlanAssignmentLimit(limit: number | null): string {
  if (limit === null) return "Unlimited lifetime generations";
  return `${limit} lifetime generations`;
}
