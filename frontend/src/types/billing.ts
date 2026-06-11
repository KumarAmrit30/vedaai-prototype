export type UserPlan = "free" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "cancelled"
  | "expired";

export type SubscriptionProvider = "manual" | "razorpay" | "stripe";

export type PlanFeatureKey =
  | "assignmentGeneration"
  | "pdfExport"
  | "library"
  | "groups"
  | "bulkActions"
  | "prioritySupport";

export type PlanFeatures = Record<PlanFeatureKey, boolean>;

export interface Plan {
  id: UserPlan;
  displayName: string;
  monthlyPrice: number | null;
  assignmentLimit: number | null;
  features: PlanFeatures;
}

export interface Subscription {
  status: SubscriptionStatus;
  provider: SubscriptionProvider | null;
  startedAt: string | null;
  expiresAt: string | null;
  providerSubscriptionId: string | null;
}

export interface BillingProfile {
  plan: UserPlan;
  subscription: Subscription;
  usage: {
    assignmentsGenerated: number;
  };
  limits: {
    assignmentsAllowed: number | null;
  };
}

export interface PlanCatalogResponse {
  success: boolean;
  data: Plan[];
}

export interface BillingProfileResponse {
  success: boolean;
  data: BillingProfile;
}
