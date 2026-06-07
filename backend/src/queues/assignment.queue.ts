import { Queue } from "bullmq";
import type { QuestionConfig } from "../modules/assignment/assignment.types";
import { logError, logInfo } from "../utils/logger";
import { isRedisQuotaExceeded, isRedisQuotaError } from "./redis-quota";
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
}

export let assignmentQueue: Queue<AssignmentGenerationJobData>;

export function isAssignmentQueueReady(): boolean {
  return Boolean(assignmentQueue && !assignmentQueue.closing);
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
  if (isRedisQuotaExceeded()) {
    throw new Error(
      "Assignment queue is temporarily unavailable (Redis quota exceeded). Please try again later.",
    );
  }

  await resumeWorkerIfPaused();

  const job = await assignmentQueue.add("generate-assignment", data, {
    jobId: data.assignmentId,
  });

  return String(job.id);
}

export async function closeAssignmentQueue(): Promise<void> {
  if (!assignmentQueue) return;

  await assignmentQueue.close();
  logInfo("[QUEUE] Assignment queue closed");
}
