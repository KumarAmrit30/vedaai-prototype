import { serializeAssignmentLimit } from "../billing/plan.config";
import type { UserDocument } from "./user.model";
import { resolveUserRole } from "./user-role";

export function serializeUserProfile(user: UserDocument) {
  const plan = user.plan;

  return {
    uid: user.firebaseUid,
    email: user.email,
    plan,
    role: resolveUserRole(user),
    usage: {
      assignmentsGenerated: user.usage?.assignmentsGenerated ?? 0,
    },
    limits: {
      assignmentsAllowed: serializeAssignmentLimit(plan),
    },
  };
}
