import { incrementAssignmentUsage } from "../../src/modules/user/user.service";
import { User } from "../../src/modules/user/user.model";

jest.mock("../../src/modules/user/user.model", () => ({
  User: {
    updateOne: jest.fn(),
  },
}));

const mockUpdateOne = User.updateOne as jest.MockedFunction<typeof User.updateOne>;

describe("incrementAssignmentUsage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("increments usage after a successful generation", async () => {
    mockUpdateOne.mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    });

    await incrementAssignmentUsage("user-a");

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { firebaseUid: "user-a" },
      { $inc: { "usage.assignmentsGenerated": 1 } },
    );
  });

  it("throws when the user does not exist", async () => {
    mockUpdateOne.mockResolvedValue({
      acknowledged: true,
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
      upsertedId: null,
    });

    await expect(incrementAssignmentUsage("missing-user")).rejects.toThrow(
      "Cannot increment usage — user not found for uid missing-user",
    );
  });
});

describe("usage tracking behavior", () => {
  it("does not expose a decrement usage helper", () => {
    const userService = jest.requireActual(
      "../../src/modules/user/user.service",
    ) as Record<string, unknown>;

    expect(userService.incrementAssignmentUsage).toBeDefined();
    expect(userService.decrementAssignmentUsage).toBeUndefined();
  });

  it("only increments usage with a positive counter", async () => {
    mockUpdateOne.mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    });

    await incrementAssignmentUsage("user-a");

    const updatePayload = mockUpdateOne.mock.calls[0]?.[1] as {
      $inc?: { "usage.assignmentsGenerated": number };
    };

    expect(updatePayload.$inc?.["usage.assignmentsGenerated"]).toBe(1);
    expect(updatePayload.$inc?.["usage.assignmentsGenerated"]).toBeGreaterThan(0);
  });

  it("does not decrement usage when assignments are deleted", () => {
    const userService = jest.requireActual(
      "../../src/modules/user/user.service",
    ) as Record<string, unknown>;

    expect(userService.decrementAssignmentUsage).toBeUndefined();
  });

  it("only calls incrementAssignmentUsage from the worker success path", () => {
    const workerSource = require("fs").readFileSync(
      require("path").join(__dirname, "../../src/queues/assignment.worker.ts"),
      "utf8",
    );
    const processJobSource = workerSource.slice(
      workerSource.indexOf("async function processAssignmentJob"),
      workerSource.indexOf("export async function startAssignmentWorker"),
    );

    expect(processJobSource).toContain("incrementAssignmentUsage(userId)");
    expect(processJobSource).toContain(
      "// Count usage only after a successful, validated completion.",
    );

    const catchBlock = processJobSource.slice(
      processJobSource.indexOf("} catch (error)"),
    );
    expect(catchBlock).not.toContain("incrementAssignmentUsage");
  });

  it("keeps usage cumulative because only increments are supported", async () => {
    mockUpdateOne.mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    });

    await incrementAssignmentUsage("user-a");
    await incrementAssignmentUsage("user-a");

    expect(mockUpdateOne).toHaveBeenCalledTimes(2);
    expect(mockUpdateOne.mock.calls.every((call) => {
      const updatePayload = call[1] as {
        $inc?: { "usage.assignmentsGenerated": number };
      };
      return updatePayload.$inc?.["usage.assignmentsGenerated"] === 1;
    })).toBe(true);
  });
});
