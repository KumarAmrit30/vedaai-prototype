export const USER_PLANS = ["free", "pro", "enterprise"] as const;

export type UserPlan = (typeof USER_PLANS)[number];

/** Free plan generation cap. Pro/enterprise are reserved for future phases. */
export const PLAN_ASSIGNMENT_LIMITS: Record<UserPlan, number> = {
  free: 3,
  pro: Number.POSITIVE_INFINITY,
  enterprise: Number.POSITIVE_INFINITY,
};

export interface UserUsage {
  assignmentsGenerated: number;
}

export interface User {
  firebaseUid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  plan: UserPlan;
  usage: UserUsage;
  createdAt: Date;
  updatedAt: Date;
}
