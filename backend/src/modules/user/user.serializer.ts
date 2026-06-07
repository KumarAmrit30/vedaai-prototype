import type { UserDocument } from "./user.model";
import { PLAN_ASSIGNMENT_LIMITS, type UserPlan } from "./user.types";

function serializeLimit(plan: UserPlan): number | null {
  const limit = PLAN_ASSIGNMENT_LIMITS[plan];
  return Number.isFinite(limit) ? limit : null;
}

export function serializeUserProfile(user: UserDocument) {
  const plan = user.plan;

  return {
    plan,
    usage: {
      assignmentsGenerated: user.usage?.assignmentsGenerated ?? 0,
    },
    limits: {
      assignmentsAllowed: serializeLimit(plan),
    },
  };
}
