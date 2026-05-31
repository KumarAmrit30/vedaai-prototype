import type { Worker } from "bullmq";
import { logInfo, logWarn } from "../utils/logger";
import type { AssignmentGenerationJobData } from "./assignment.queue";
import { isRedisQuotaError, isRedisQuotaExceeded } from "./redis-quota";

let workerRef: Worker<AssignmentGenerationJobData> | null = null;
let idlePauseTimer: ReturnType<typeof setTimeout> | null = null;
let closingWorker = false;

/** Covers Upstash commandTimeout (15s) after pause(true) interrupts an in-flight BZPOPMIN. */
const CONTROL_ERROR_SUPPRESS_MS = 20_000;
let suppressControlErrorsUntil = 0;

function isBlockingControlInterruptMessage(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("command timed out") ||
    message.includes("connection is closed") ||
    message.includes("connection closed")
  );
}

/** BullMQ pause/close disconnects the blocking connection — ioredis may emit a timeout. */
export function markWorkerControlAction(): void {
  suppressControlErrorsUntil = Date.now() + CONTROL_ERROR_SUPPRESS_MS;
}

export function markWorkerClosing(): void {
  closingWorker = true;
  markWorkerControlAction();
}

export function isExpectedWorkerControlError(error: unknown): boolean {
  if (!isBlockingControlInterruptMessage(error)) {
    return false;
  }

  if (closingWorker || workerRef?.closing) {
    return true;
  }

  return Date.now() < suppressControlErrorsUntil;
}

export function registerAssignmentWorker(
  worker: Worker<AssignmentGenerationJobData>,
): void {
  workerRef = worker;
}

export function clearIdlePauseTimer(): void {
  if (idlePauseTimer) {
    clearTimeout(idlePauseTimer);
    idlePauseTimer = null;
  }
}

export function schedulePauseWhenIdle(): void {
  clearIdlePauseTimer();

  idlePauseTimer = setTimeout(() => {
    idlePauseTimer = null;

    if (!workerRef || workerRef.closing || workerRef.isPaused()) {
      return;
    }

    markWorkerControlAction();

    void workerRef
      .pause(true)
      .then(() => {
        logInfo("[WORKER] Paused while queue is idle (Redis polling stopped)");
      })
      .catch((error: Error) => {
        if (!isRedisQuotaError(error)) {
          logWarn("[WORKER] Failed to pause idle worker", { message: error.message });
        }
      });
  }, 1_500);
}

export async function resumeWorkerIfPaused(): Promise<void> {
  if (!workerRef || workerRef.closing) return;
  if (isRedisQuotaExceeded()) return;

  clearIdlePauseTimer();

  if (workerRef.isPaused() || !workerRef.isRunning()) {
    workerRef.resume();
    logInfo("[WORKER] Resumed for incoming job");
  }
}

export async function closeRegisteredWorker(force = false): Promise<void> {
  clearIdlePauseTimer();

  if (!workerRef || workerRef.closing) return;

  markWorkerClosing();

  await workerRef.close(force);
  workerRef = null;
}
