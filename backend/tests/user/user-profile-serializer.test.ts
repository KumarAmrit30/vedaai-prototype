import { serializeUserProfile } from "../../src/modules/user/user.serializer";
import { buildUserFixture } from "../helpers/user-fixtures";

describe("serializeUserProfile", () => {
  it("includes uid, email, plan, and role", () => {
    const user = buildUserFixture("free", 2, "firebase-uid-123", "admin");
    user.email = "teacher@school.edu";

    expect(serializeUserProfile(user)).toEqual({
      uid: "firebase-uid-123",
      email: "teacher@school.edu",
      plan: "free",
      role: "admin",
      usage: {
        assignmentsGenerated: 2,
      },
      limits: {
        assignmentsAllowed: 3,
      },
    });
  });

  it("defaults missing role to user for legacy documents", () => {
    const user = buildUserFixture("pro", 0);
    delete (user as { role?: string }).role;

    expect(serializeUserProfile(user).role).toBe("user");
  });
});
