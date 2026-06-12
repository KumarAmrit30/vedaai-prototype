import { recoverStaleAssignments } from "../../src/modules/assignment/assignment-recovery.service";
import { Assignment } from "../../src/modules/assignment/assignment.model";
import { logInfo, logWarn } from "../../src/utils/logger";

jest.mock("../../src/modules/assignment/assignment.model", () => ({
  Assignment: {
    find: jest.fn(),
  },
}));

jest.mock("../../src/utils/logger", () => ({
  logWarn: jest.fn(),
  logInfo: jest.fn(),
}));

const mockFind = Assignment.find as jest.MockedFunction<typeof Assignment.find>;
const mockLogWarn = logWarn as jest.MockedFunction<typeof logWarn>;
const mockLogInfo = logInfo as jest.MockedFunction<typeof logInfo>;

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

interface MockAssignment {
  _id: string;
  userId: string;
  status: string;
  startedAt: Date;
  isDeleted?: boolean;
  generationMetrics?: { errorCategory?: string };
  failureReason?: string;
  completedAt?: Date;
  save: jest.Mock;
}

function createProcessingAssignment(
  startedMinutesAgo: number,
  overrides: Partial<MockAssignment> = {},
): MockAssignment {
  return {
    _id: "assignment-1",
    userId: "user-a",
    status: "processing",
    startedAt: new Date(Date.now() - startedMinutesAgo * 60 * 1000),
    generationMetrics: {},
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function getFindFilter(): {
  status: string;
  startedAt: { $exists: boolean; $lt: Date };
  isDeleted: { $ne: boolean };
} {
  const filter = mockFind.mock.calls[0]?.[0] as {
    status: string;
    startedAt: { $exists: boolean; $lt: Date };
    isDeleted: { $ne: boolean };
  };

  if (!filter) {
    throw new Error("Assignment.find was not called");
  }

  return filter;
}

describe("recoverStaleAssignments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockResolvedValue([]);
  });

  it("recovers a processing assignment started 35 minutes ago", async () => {
    const staleAssignment = createProcessingAssignment(35);
    mockFind.mockResolvedValue([staleAssignment as never]);

    const result = await recoverStaleAssignments();

    expect(result).toEqual({ recoveredCount: 1 });
    expect(staleAssignment.status).toBe("failed");
    expect(staleAssignment.failureReason).toBe(
      "Assignment generation timed out",
    );
    expect(staleAssignment.completedAt).toBeInstanceOf(Date);
    expect(staleAssignment.generationMetrics?.errorCategory).toBe("timeout");
    expect(staleAssignment.save).toHaveBeenCalledTimes(1);
    expect(mockLogWarn).toHaveBeenCalledWith(
      "[RECOVERY] Recovered stale assignment",
      {
        assignmentId: "assignment-1",
        userId: "user-a",
        startedAt: staleAssignment.startedAt,
      },
    );
    expect(mockLogInfo).toHaveBeenCalledWith(
      "[RECOVERY] Stale assignment scan completed",
      { recoveredCount: 1 },
    );
  });

  it("leaves a processing assignment started 10 minutes ago unchanged", async () => {
    const recentAssignment = createProcessingAssignment(10);

    await recoverStaleAssignments();

    const filter = getFindFilter();
    const cutoff = filter.startedAt.$lt.getTime();
    const recentStartedAt = recentAssignment.startedAt.getTime();

    expect(recentStartedAt).toBeGreaterThan(cutoff);
    expect(recentAssignment.save).not.toHaveBeenCalled();
    expect(mockLogWarn).not.toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      "[RECOVERY] Stale assignment scan completed",
      { recoveredCount: 0 },
    );
  });

  it("leaves a completed assignment started 40 minutes ago unchanged", async () => {
    await recoverStaleAssignments();

    expect(getFindFilter().status).toBe("processing");
    expect(mockLogWarn).not.toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      "[RECOVERY] Stale assignment scan completed",
      { recoveredCount: 0 },
    );
  });

  it("leaves a deleted processing assignment started 40 minutes ago unchanged", async () => {
    await recoverStaleAssignments();

    expect(getFindFilter().isDeleted).toEqual({ $ne: true });
    expect(mockLogWarn).not.toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      "[RECOVERY] Stale assignment scan completed",
      { recoveredCount: 0 },
    );
  });

  it("uses a 30-minute stale threshold", async () => {
    await recoverStaleAssignments();

    const cutoff = getFindFilter().startedAt.$lt.getTime();
    const expectedCutoff = Date.now() - THIRTY_MINUTES_MS;

    expect(Math.abs(cutoff - expectedCutoff)).toBeLessThan(1000);
  });
});
