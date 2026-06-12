import type { Worker } from "bullmq";
import { logInfo, logWarn } from "../utils/logger";
import type { AssignmentGenerationJobData } from "./assignment.queue";
import { isRedisQuotaError, isRedisQuotaExceeded } from "./redis-quota";

let workerRef: Worker<AssignmentGenerationJobData> | null = null;
let idlePauseTimer: ReturnType<typeof setTimeout> | null = null;
let closingWorker = false;
let loopStartInFlight = false;

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
        logInfo("[WORKER] Paused while queue is idle");
      })
      .catch((error: Error) => {
        if (!isRedisQuotaError(error)) {
          logWarn("[WORKER] Failed to pause idle worker", { message: error.message });
        }
      });
  }, 1_500);
}

/**
 * Starts or resumes the BullMQ processing loop without blocking the caller.
 * run() must not be awaited here — it only resolves when the main loop exits.
 */
function ensureWorkerProcessing(coldStart: boolean): void {
  if (!workerRef || workerRef.closing || isRedisQuotaExceeded()) {
    return;
  }

  const worker = workerRef;

  if (worker.isRunning()) {
    if (worker.isPaused()) {
      worker.resume();
      logInfo("[WORKER] Resumed from idle pause");
    }
    return;
  }

  if (worker.isPaused()) {
    worker.resume();
    logInfo("[WORKER] Resumed from idle pause");
    logInfo("[WORKER] Started processing loop");
    return;
  }

  if (loopStartInFlight) {
    return;
  }

  loopStartInFlight = true;

  void worker
    .run()
    .catch((error: Error) => {
      if (error.message !== "Worker is already running.") {
        logWarn("[WORKER] Processing loop error", { message: error.message });
      }
    })
    .finally(() => {
      loopStartInFlight = false;
    });

  if (coldStart) {
    logInfo("[WORKER] Cold-start recovery triggered");
  }

  logInfo("[WORKER] Started processing loop");
}

export async function resumeWorkerIfPaused(): Promise<void> {
  clearIdlePauseTimer();
  ensureWorkerProcessing(true);
}

export function startWorkerProcessingIfNeeded(): void {
  ensureWorkerProcessing(false);
}

export type WorkerHealthState = "running" | "idle" | "paused" | "stopped";

export function getWorkerHealthState(): WorkerHealthState {
  if (!workerRef || workerRef.closing) {
    return "stopped";
  }

  if (workerRef.isPaused()) {
    return "paused";
  }

  if (workerRef.isRunning() || loopStartInFlight) {
    return "running";
  }

  return "idle";
}

/** True when a worker is registered and able to process jobs. */
export function isWorkerRunning(): boolean {
  if (isRedisQuotaExceeded()) {
    return false;
  }

  if (!workerRef || workerRef.closing) {
    return false;
  }

  return true;
}

export async function closeRegisteredWorker(force = false): Promise<void> {
  clearIdlePauseTimer();

  if (!workerRef || workerRef.closing) return;

  markWorkerClosing();

  await workerRef.close(force);
  workerRef = null;
}
