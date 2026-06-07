import { readFileSync } from "node:fs";
import { join } from "node:path";
import mongoose from "mongoose";
import { env } from "../../config/env";
import { isAssignmentQueueReady } from "../../queues/assignment.queue";
import { isRedisQuotaExceeded } from "../../queues/redis-quota";
import { sharedConnection } from "../../queues/redis";
import {
  getWorkerHealthState,
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
  uptimeSeconds: number;
  timestamp: string;
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

export function collectHealthReport(): HealthReport {
  const mongodb = getMongoHealth();
  const redis = getRedisHealth();
  const queue = getQueueHealth();
  const worker = getWorkerHealthState();

  return {
    status: resolveOverallStatus(mongodb, redis, queue),
    service: "ExamForge AI",
    version: packageVersion,
    mongodb,
    redis,
    queue,
    worker,
    aiProvider: env.aiProvider,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
