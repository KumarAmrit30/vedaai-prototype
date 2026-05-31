import type { Worker } from "bullmq";
import { logInfo, logWarn } from "../utils/logger";
import type { AssignmentGenerationJobData } from "./assignment.queue";
import { isRedisQuotaError, isRedisQuotaExceeded } from "./redis-quota";

let workerRef: Worker<AssignmentGenerationJobData> | null = null;
let idlePauseTimer: ReturnType<typeof setTimeout> | null = null;

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

  await workerRef.close(force);
  workerRef = null;
}
