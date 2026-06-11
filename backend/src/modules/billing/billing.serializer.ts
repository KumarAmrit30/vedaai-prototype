import {
  listPlanCatalog,
  serializeAssignmentLimit,
  type PlanConfigEntry,
} from "./plan.config";
import type { UserDocument } from "../user/user.model";
import type { UserSubscription } from "../user/user.types";

function serializeSubscription(
  subscription?: UserSubscription,
): {
  status: UserSubscription["status"];
  provider: UserSubscription["provider"];
  startedAt: string | null;
  expiresAt: string | null;
  providerSubscriptionId: string | null;
} {
  return {
    status: subscription?.status ?? "inactive",
    provider: subscription?.provider ?? null,
    startedAt: subscription?.startedAt?.toISOString() ?? null,
    expiresAt: subscription?.expiresAt?.toISOString() ?? null,
    providerSubscriptionId: subscription?.providerSubscriptionId ?? null,
  };
}

export function serializePlanCatalogEntry(plan: PlanConfigEntry) {
  return {
    id: plan.id,
    displayName: plan.displayName,
    monthlyPrice: plan.monthlyPrice,
    assignmentLimit: Number.isFinite(plan.assignmentLimit)
      ? plan.assignmentLimit
      : null,
    features: plan.features,
  };
}

export function serializePlanCatalog() {
  return listPlanCatalog().map(serializePlanCatalogEntry);
}

export function serializeCurrentPlan(user: UserDocument) {
  const plan = user.plan;

  return {
    plan,
    subscription: serializeSubscription(user.subscription),
    usage: {
      assignmentsGenerated: user.usage?.assignmentsGenerated ?? 0,
    },
    limits: {
      assignmentsAllowed: serializeAssignmentLimit(plan),
    },
  };
}
