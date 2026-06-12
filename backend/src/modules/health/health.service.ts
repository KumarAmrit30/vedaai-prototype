import { readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";
import { env, getActiveAIModel } from "../../config/env";
import { countStuckAssignments } from "../assignment/assignment.queries";
import {
  assignmentQueue,
  isAssignmentQueueReady,
  isQueuePaused,
} from "../../queues/assignment.queue";
import { isRedisQuotaExceeded } from "../../queues/redis-quota";
import { sharedConnection } from "../../queues/redis";
import {
  getWorkerHealthState,
  isWorkerRunning,
  type WorkerHealthState,
} from "../../queues/worker-lifecycle";

const packageVersion = (
  JSON.parse(
    readFileSync(join(__dirname, "../../../package.json"), "utf8"),
  ) as { version: string }
).version;

export type DependencyStatus = "connected" | "disconnected";
export type QueueHealthStatus = "ready" | "not_ready";
export type OverallHealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthReport {
  status: OverallHealthStatus;
  service: "ExamForge AI";
  version: string;
  mongodb: DependencyStatus;
  redis: DependencyStatus;
  queue: QueueHealthStatus;
  worker: WorkerHealthState;
  aiProvider: (typeof env)["aiProvider"];
  aiModel: string;
  aiTimeoutMs: number;
  authEnabled: boolean;
  redisQuotaExceeded: boolean;
  pendingJobs: number;
  failedJobs: number;
  uptimeSeconds: number;
  timestamp: string;
  stuckAssignments: number;
  queuePaused: boolean;
  workerRunning: boolean;
}

function getActiveAIModelForHealth(): string {
  return getActiveAIModel();
}

function getMongoHealth(): DependencyStatus {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
}

function getRedisHealth(): DependencyStatus {
  if (!sharedConnection) {
    return "disconnected";
  }

  const { status } = sharedConnection;
  return status === "ready" || status === "connect" ? "connected" : "disconnected";
}

function getQueueHealth(): QueueHealthStatus {
  return isAssignmentQueueReady() ? "ready" : "not_ready";
}

async function getQueueJobCounts(): Promise<{
  pendingJobs: number;
  failedJobs: number;
}> {
  if (!isAssignmentQueueReady()) {
    return { pendingJobs: 0, failedJobs: 0 };
  }

  const counts = await assignmentQueue.getJobCounts("wait", "delayed", "failed");

  return {
    pendingJobs: (counts.wait ?? 0) + (counts.delayed ?? 0),
    failedJobs: counts.failed ?? 0,
  };
}

function resolveOverallStatus(
  mongodb: DependencyStatus,
  redis: DependencyStatus,
  queue: QueueHealthStatus,
): OverallHealthStatus {
  const failureCount = [
    mongodb !== "connected",
    redis !== "connected",
    queue !== "ready",
  ].filter(Boolean).length;

  if (failureCount >= 2) {
    return "unhealthy";
  }

  if (failureCount === 1 || isRedisQuotaExceeded()) {
    return "degraded";
  }

  return "healthy";
}

export async function collectHealthReport(): Promise<HealthReport> {
  const mongodb = getMongoHealth();
  const redis = getRedisHealth();
  const queue = getQueueHealth();
  const worker = getWorkerHealthState();
  const { pendingJobs, failedJobs } = await getQueueJobCounts();
  const stuckAssignments = await countStuckAssignments();

  return {
    status: resolveOverallStatus(mongodb, redis, queue),
    service: "ExamForge AI",
    version: packageVersion,
    mongodb,
    redis,
    queue,
    worker,
    aiProvider: env.aiProvider,
    aiModel: getActiveAIModelForHealth(),
    aiTimeoutMs: env.aiRequestTimeoutMs,
    authEnabled: env.authEnabled,
    redisQuotaExceeded: isRedisQuotaExceeded(),
    pendingJobs,
    failedJobs,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    stuckAssignments,
    queuePaused: isQueuePaused(),
    workerRunning: isWorkerRunning(),
  };
}
