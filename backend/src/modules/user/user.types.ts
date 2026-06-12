export const USER_PLANS = ["free", "pro", "enterprise"] as const;

export type UserPlan = (typeof USER_PLANS)[number];

export const USER_ROLES = ["user", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const SUBSCRIPTION_STATUSES = [
  "inactive",
  "active",
  "cancelled",
  "expired",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_PROVIDERS = ["manual", "razorpay", "stripe"] as const;

export type SubscriptionProvider = (typeof SUBSCRIPTION_PROVIDERS)[number];

export interface UserSubscription {
  status: SubscriptionStatus;
  provider: SubscriptionProvider | null;
  startedAt?: Date;
  expiresAt?: Date;
  providerSubscriptionId?: string;
}

export interface UserUsage {
  assignmentsGenerated: number;
}

export interface User {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  plan: UserPlan;
  role?: UserRole;
  subscription: UserSubscription;
  usage: UserUsage;
  createdAt: Date;
  updatedAt: Date;
}
