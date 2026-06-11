import { serializeAssignmentLimit } from "../billing/plan.config";
import type { UserDocument } from "./user.model";

export function serializeUserProfile(user: UserDocument) {
  const plan = user.plan;

  return {
    plan,
    usage: {
      assignmentsGenerated: user.usage?.assignmentsGenerated ?? 0,
    },
    limits: {
      assignmentsAllowed: serializeAssignmentLimit(plan),
    },
  };
}
