import type { Request } from "express";
import { shouldBypassAssignmentRateLimit } from "../../src/middleware/assignment-rate-limit";
import { findUserByFirebaseUid } from "../../src/modules/user/user.service";
import { buildUserFixture } from "../helpers/user-fixtures";

jest.mock("../../src/modules/user/user.service", () => ({
  findUserByFirebaseUid: jest.fn(),
}));

jest.mock("../../src/config/env", () => ({
  env: {
    authEnabled: true,
  },
}));

const mockFindUser = findUserByFirebaseUid as jest.MockedFunction<
  typeof findUserByFirebaseUid
>;

function buildRequest(uid?: string): Request {
  return {
    auth: uid ? { uid } : undefined,
  } as Request;
}

describe("shouldBypassAssignmentRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("bypasses rate limiting for admin users", async () => {
    mockFindUser.mockResolvedValue(
      buildUserFixture("free", 0, "admin-user-1", "admin"),
    );

    await expect(
      shouldBypassAssignmentRateLimit(buildRequest("admin-user-1")),
    ).resolves.toBe(true);
  });

  it("does not bypass rate limiting for regular users", async () => {
    mockFindUser.mockResolvedValue(buildUserFixture("free", 0, "user-1", "user"));

    await expect(
      shouldBypassAssignmentRateLimit(buildRequest("user-1")),
    ).resolves.toBe(false);
  });

  it("does not bypass rate limiting for unauthenticated requests", async () => {
    await expect(shouldBypassAssignmentRateLimit(buildRequest())).resolves.toBe(
      false,
    );
    expect(mockFindUser).not.toHaveBeenCalled();
  });
});
