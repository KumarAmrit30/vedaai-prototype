import { Queue } from "bullmq";
import type { QuestionConfig } from "../modules/assignment/assignment.types";
import { logInfo } from "../utils/logger";
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

  logInfo("[QUEUE] Assignment queue initialized");
}

export async function enqueueAssignmentGeneration(
  data: AssignmentGenerationJobData,
): Promise<string> {
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
