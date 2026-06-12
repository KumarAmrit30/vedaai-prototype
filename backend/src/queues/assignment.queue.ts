import { Queue } from "bullmq";
import type { QuestionConfig } from "../modules/assignment/assignment.types";
import { logError, logInfo } from "../utils/logger";
import { isRedisQuotaError, isRedisQuotaExceeded } from "./redis-quota";
import { QueueUnavailableError } from "./queue-unavailable.error";
import { resumeWorkerIfPaused } from "./worker-lifecycle";
import { queueConnection } from "./redis";

export const ASSIGNMENT_QUEUE_NAME = "assignment-generation";

export interface AssignmentGenerationJobData {
  assignmentId: string;
  title: string;
  topic: string;
  dueDate: string;
  instructions: string;
  questionConfig: QuestionConfig;
  materialText?: string;
  metadata?: Record<string, unknown>;
  uploadPaths?: string[];
  /** Firebase uid of the creator — used to count usage only on completion. */
  ownerUid?: string;
}

export let assignmentQueue: Queue<AssignmentGenerationJobData>;

export function isAssignmentQueueReady(): boolean {
  return Boolean(assignmentQueue && !assignmentQueue.closing);
}

/** True when the queue cannot accept new jobs (not ready, Redis down, or quota exceeded). */
export function isQueuePaused(): boolean {
  if (!isAssignmentQueueReady()) {
    return true;
  }

  if (isRedisQuotaExceeded()) {
    return true;
  }

  if (!queueConnection) {
    return true;
  }

  const { status } = queueConnection;
  return status !== "ready" && status !== "connect";
}

export function initAssignmentQueue(): void {
  assignmentQueue = new Queue<AssignmentGenerationJobData>(
    ASSIGNMENT_QUEUE_NAME,
    {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: {
          count: 100,
        },
      },
    },
  );

  assignmentQueue.on("error", (error: Error) => {
    if (isRedisQuotaError(error)) {
      logError("[QUEUE] Redis quota exceeded — queue errors suppressed", {
        message: error.message,
      });
      return;
    }

    logError("[QUEUE] Queue error", { message: error.message });
  });

  logInfo("[QUEUE] Assignment queue initialized");
}

export async function enqueueAssignmentGeneration(
  data: AssignmentGenerationJobData,
): Promise<string> {
  if (isQueuePaused()) {
    throw new QueueUnavailableError();
  }

  try {
    await resumeWorkerIfPaused();

    const job = await assignmentQueue.add("generate-assignment", data, {
      jobId: data.assignmentId,
    });

    logInfo("[QUEUE] Assignment queued", {
      assignmentId: data.assignmentId,
      ...(data.ownerUid ? { uid: data.ownerUid } : {}),
      jobId: String(job.id),
    });

    return String(job.id);
  } catch (error) {
    if (error instanceof QueueUnavailableError) {
      throw error;
    }

    throw new QueueUnavailableError();
  }
}

export async function closeAssignmentQueue(): Promise<void> {
  if (!assignmentQueue) return;

  await assignmentQueue.close();
  logInfo("[QUEUE] Assignment queue closed");
}
