import { Worker, type Job } from "bullmq";
import { Assignment } from "../modules/assignment/assignment.model";
import {
  findActiveAssignmentById,
  NOT_DELETED_FILTER,
} from "../modules/assignment/assignment.queries";
import { generateAssignmentPaper } from "../services/ai.service";
import { deleteUploadedFiles } from "../services/material-parser.service";
import {
  emitAssignmentCompleted,
  emitAssignmentFailed,
  emitAssignmentProcessing,
} from "../socket/assignment.socket";
import { logError, logInfo, logWarn } from "../utils/logger";
import {
  ASSIGNMENT_QUEUE_NAME,
  type AssignmentGenerationJobData,
} from "./assignment.queue";
import { workerConnection } from "./redis";

export let assignmentWorker: Worker<AssignmentGenerationJobData>;

async function updateAssignmentProgress(
  assignmentId: string,
  progress: number,
): Promise<void> {
  const updated = await Assignment.findOneAndUpdate(
    { _id: assignmentId, ...NOT_DELETED_FILTER },
    { progress },
    { new: true },
  );

  if (!updated) return;

  emitAssignmentProcessing(assignmentId, progress);
}

async function processAssignmentJob(
  job: Job<AssignmentGenerationJobData>,
): Promise<void> {
  const { assignmentId, uploadPaths, ...formData } = job.data;

  if (!assignmentId) {
    throw new Error("Assignment job missing assignmentId");
  }

  const assignment = await findActiveAssignmentById(assignmentId);

  if (!assignment) {
    logWarn("[WORKER] Assignment not found or deleted, skipping job", {
      assignmentId,
      jobId: job.id,
    });
    return;
  }

  const materialText = formData.materialText ?? assignment.materialText;

  try {
    assignment.status = "processing";
    assignment.startedAt = assignment.startedAt ?? new Date();
    assignment.progress = 5;
    await assignment.save();
    emitAssignmentProcessing(assignmentId, 5);
    await job.updateProgress(5);

    await updateAssignmentProgress(assignmentId, 20);
    await job.updateProgress(20);

    const aiInput: Parameters<typeof generateAssignmentPaper>[0] = {
      title: formData.title,
      topic: formData.topic,
      instructions: formData.instructions,
      questionConfig: formData.questionConfig,
      ...(materialText ? { materialText } : {}),
    };

    const generatedPaper = await generateAssignmentPaper(aiInput);

    await updateAssignmentProgress(assignmentId, 85);
    await job.updateProgress(85);

    assignment.generatedPaper = generatedPaper;
    assignment.status = "completed";
    assignment.progress = 100;
    assignment.completedAt = new Date();
    await assignment.save();
    emitAssignmentCompleted(assignmentId, generatedPaper);
    await job.updateProgress(100);

    logInfo("[WORKER] Assignment completed", { assignmentId, jobId: job.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const maxAttempts = job.opts.attempts ?? 3;
    const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

    logError("[WORKER] Job attempt failed", {
      assignmentId,
      jobId: job.id,
      attempt: job.attemptsMade + 1,
      maxAttempts,
      message,
    });

    if (isFinalAttempt) {
      try {
        const failedAssignment = await findActiveAssignmentById(assignmentId);
        if (failedAssignment) {
          failedAssignment.status = "failed";
          failedAssignment.failureReason = message;
          failedAssignment.progress = 0;
          failedAssignment.completedAt = new Date();
          await failedAssignment.save();
          emitAssignmentFailed(assignmentId, message);
        }
      } catch (saveError) {
        const saveMessage =
          saveError instanceof Error ? saveError.message : "Unknown save error";
        logError("[WORKER] Failed to persist failure state", { saveMessage });
      }
    }

    throw error instanceof Error ? error : new Error(message);
  } finally {
    if (uploadPaths?.length) {
      await deleteUploadedFiles(uploadPaths);
    }
  }
}

export async function startAssignmentWorker(): Promise<void> {
  assignmentWorker = new Worker<AssignmentGenerationJobData>(
    ASSIGNMENT_QUEUE_NAME,
    processAssignmentJob,
    {
      connection: workerConnection,
    },
  );

  assignmentWorker.on("error", (error: Error) => {
    logError("[WORKER] Worker error", { message: error.message });
  });

  assignmentWorker.on("failed", (job, error) => {
    logError("[WORKER] Job failed", {
      jobId: job?.id ?? "unknown",
      assignmentId: job?.data.assignmentId,
      message: error.message,
    });
  });

  await assignmentWorker.waitUntilReady();
  logInfo("[WORKER] Assignment worker ready");
}

export async function closeAssignmentWorker(): Promise<void> {
  if (!assignmentWorker) return;

  await assignmentWorker.close();
  logInfo("[WORKER] Assignment worker closed");
}
