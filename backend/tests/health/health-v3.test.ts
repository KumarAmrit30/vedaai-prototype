import mongoose from "mongoose";
import { collectHealthReport } from "../../src/modules/health/health.service";
import { countStuckAssignments } from "../../src/modules/assignment/assignment.queries";
import {
  assignmentQueue,
  isAssignmentQueueReady,
  isQueuePaused,
} from "../../src/queues/assignment.queue";
import { isRedisQuotaExceeded } from "../../src/queues/redis-quota";
import { sharedConnection } from "../../src/queues/redis";
import {
  getWorkerHealthState,
  isWorkerRunning,
} from "../../src/queues/worker-lifecycle";

jest.mock("../../src/modules/assignment/assignment.queries", () => ({
  countStuckAssignments: jest.fn(),
}));

jest.mock("../../src/queues/assignment.queue", () => ({
  assignmentQueue: {
    getJobCounts: jest.fn(),
    closing: false,
  },
  isAssignmentQueueReady: jest.fn(),
  isQueuePaused: jest.fn(),
}));

jest.mock("../../src/queues/redis-quota", () => ({
  isRedisQuotaExceeded: jest.fn(),
}));

jest.mock("../../src/queues/redis", () => ({
  sharedConnection: { status: "ready" },
}));

jest.mock("../../src/queues/worker-lifecycle", () => ({
  getWorkerHealthState: jest.fn(),
  isWorkerRunning: jest.fn(),
}));

const mockCountStuckAssignments = countStuckAssignments as jest.MockedFunction<
  typeof countStuckAssignments
>;
const mockIsAssignmentQueueReady = isAssignmentQueueReady as jest.MockedFunction<
  typeof isAssignmentQueueReady
>;
const mockIsQueuePaused = isQueuePaused as jest.MockedFunction<
  typeof isQueuePaused
>;
const mockIsRedisQuotaExceeded = isRedisQuotaExceeded as jest.MockedFunction<
  typeof isRedisQuotaExceeded
>;
const mockGetWorkerHealthState = getWorkerHealthState as jest.MockedFunction<
  typeof getWorkerHealthState
>;
const mockIsWorkerRunning = isWorkerRunning as jest.MockedFunction<
  typeof isWorkerRunning
>;
const mockGetJobCounts = assignmentQueue.getJobCounts as jest.Mock;

const LEGACY_HEALTH_FIELDS = [
  "status",
  "service",
  "version",
  "mongodb",
  "redis",
  "queue",
  "worker",
  "aiProvider",
  "aiModel",
  "aiTimeoutMs",
  "authEnabled",
  "redisQuotaExceeded",
  "pendingJobs",
  "failedJobs",
  "uptimeSeconds",
  "timestamp",
] as const;

describe("Health V3", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCountStuckAssignments.mockResolvedValue(0);
    mockIsAssignmentQueueReady.mockReturnValue(true);
    mockIsQueuePaused.mockReturnValue(false);
    mockIsRedisQuotaExceeded.mockReturnValue(false);
    mockGetWorkerHealthState.mockReturnValue("running");
    mockIsWorkerRunning.mockReturnValue(true);
    mockGetJobCounts.mockResolvedValue({ wait: 0, delayed: 0, failed: 0 });
    Object.defineProperty(mongoose.connection, "readyState", {
      configurable: true,
      value: 1,
    });
    Object.defineProperty(sharedConnection, "status", {
      configurable: true,
      value: "ready",
    });
  });

  it("returns stuckAssignments count", async () => {
    mockCountStuckAssignments.mockResolvedValue(3);

    const report = await collectHealthReport();

    expect(report.stuckAssignments).toBe(3);
    expect(mockCountStuckAssignments).toHaveBeenCalledTimes(1);
  });

  it("returns workerRunning boolean", async () => {
    mockIsWorkerRunning.mockReturnValue(false);

    const report = await collectHealthReport();

    expect(report.workerRunning).toBe(false);
    expect(typeof report.workerRunning).toBe("boolean");
  });

  it("returns queuePaused boolean", async () => {
    mockIsQueuePaused.mockReturnValue(true);

    const report = await collectHealthReport();

    expect(report.queuePaused).toBe(true);
    expect(typeof report.queuePaused).toBe("boolean");
  });

  it("keeps the health response backward compatible", async () => {
    mockCountStuckAssignments.mockResolvedValue(2);
    mockIsQueuePaused.mockReturnValue(false);
    mockIsWorkerRunning.mockReturnValue(true);
    mockGetJobCounts.mockResolvedValue({ wait: 1, delayed: 2, failed: 4 });

    const report = await collectHealthReport();

    for (const field of LEGACY_HEALTH_FIELDS) {
      expect(report).toHaveProperty(field);
    }

    expect(report).toMatchObject({
      stuckAssignments: 2,
      queuePaused: false,
      workerRunning: true,
      pendingJobs: 3,
      failedJobs: 4,
    });
  });
});
