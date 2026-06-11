import { USER_PLANS, type UserPlan } from "../user/user.types";

export const PLAN_FEATURE_KEYS = [
  "assignmentGeneration",
  "pdfExport",
  "library",
  "groups",
  "bulkActions",
  "prioritySupport",
] as const;

export type PlanFeatureKey = (typeof PLAN_FEATURE_KEYS)[number];

export type PlanFeatures = Record<PlanFeatureKey, boolean>;

export interface PlanConfigEntry {
  id: UserPlan;
  displayName: string;
  /** USD per month; `null` means custom / contact sales (enterprise). */
  monthlyPrice: number | null;
  assignmentLimit: number;
  features: PlanFeatures;
}

export const PLAN_CONFIG: Record<UserPlan, PlanConfigEntry> = {
  free: {
    id: "free",
    displayName: "Free",
    monthlyPrice: 0,
    assignmentLimit: 3,
    features: {
      assignmentGeneration: true,
      pdfExport: true,
      library: false,
      groups: false,
      bulkActions: true,
      prioritySupport: false,
    },
  },
  pro: {
    id: "pro",
    displayName: "Pro",
    monthlyPrice: 29,
    assignmentLimit: Number.POSITIVE_INFINITY,
    features: {
      assignmentGeneration: true,
      pdfExport: true,
      library: true,
      groups: true,
      bulkActions: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    id: "enterprise",
    displayName: "Enterprise",
    monthlyPrice: null,
    assignmentLimit: Number.POSITIVE_INFINITY,
    features: {
      assignmentGeneration: true,
      pdfExport: true,
      library: true,
      groups: true,
      bulkActions: true,
      prioritySupport: true,
    },
  },
};

export function getPlanConfig(plan: UserPlan): PlanConfigEntry {
  return PLAN_CONFIG[plan];
}

export function getAssignmentLimit(plan: UserPlan): number {
  return PLAN_CONFIG[plan].assignmentLimit;
}

export function serializeAssignmentLimit(plan: UserPlan): number | null {
  const limit = getAssignmentLimit(plan);
  return Number.isFinite(limit) ? limit : null;
}

export function listPlanCatalog(): PlanConfigEntry[] {
  return USER_PLANS.map((id) => PLAN_CONFIG[id]);
}

export function hasPlanFeature(plan: UserPlan, feature: PlanFeatureKey): boolean {
  return PLAN_CONFIG[plan].features[feature];
}
