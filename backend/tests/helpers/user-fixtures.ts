import type { UserDocument } from "../../src/modules/user/user.model";
import type { UserPlan, UserRole } from "../../src/modules/user/user.types";

export function buildUserFixture(
  plan: UserPlan,
  assignmentsGenerated = 0,
  firebaseUid = "user-test-1",
  role: UserRole = "user",
): UserDocument {
  return {
    firebaseUid,
    email: `${firebaseUid}@test.examforge.internal`,
    plan,
    role,
    subscription: {
      status: "inactive",
      provider: null,
    },
    usage: {
      assignmentsGenerated,
    },
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  } as UserDocument;
}
