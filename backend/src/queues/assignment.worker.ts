import { Worker, type Job } from "bullmq";
import { Assignment } from "../modules/assignment/assignment.model";
import {
  findActiveAssignmentByIdInternal,
  NOT_DELETED_FILTER,
} from "../modules/assignment/assignment.queries";
import { incrementAssignmentUsage } from "../modules/user/user.service";
import { generateAssignmentPaper } from "../services/ai.service";
import { getAIProvider } from "../services/ai/providers";
import {
  AssignmentGenerationError,
  classifyGenerationError,
} from "../services/ai/generation-metrics";
import { deleteUploadedFiles } from "../services/material-parser.service";
import {
  emitAssignmentCompleted,
  emitAssignmentFailed,
  emitAssignmentProcessing,
} from "../socket/assignment.socket";
import { logError, logInfo, logWarn } from "../utils/logger";
import {
  assignmentQueue,
  ASSIGNMENT_QUEUE_NAME,
  type AssignmentGenerationJobData,
} from "./assignment.queue";
import {
  isRedisQuotaError,
  isRedisQuotaExceeded,
  markRedisQuotaExceeded,
} from "./redis-quota";
import { workerConnection } from "./redis";
import {
  clearIdlePauseTimer,
  closeRegisteredWorker,
  isExpectedWorkerControlError,
  registerAssignmentWorker,
  schedulePauseWhenIdle,
  startWorkerProcessingIfNeeded,
} from "./worker-lifecycle";

export let assignmentWorker: Worker<AssignmentGenerationJobData>;

/** Longer blocking interval when worker is active — default 5s burns ~500k Upstash cmds/month idle. */
const WORKER_DRAIN_DELAY_SEC = 60;
/** Single Render instance — stalled recovery is optional; disabling saves periodic Redis scans. */
const WORKER_SKIP_STALLED_CHECK = true;

let quotaShutdownPromise: Promise<void> | null = null;
let workerErrorLoggedAfterQuota = false;

async function shutdownOnQuotaExceeded(): Promise<void> {
  if (quotaShutdownPromise) return quotaShutdownPromise;

  quotaShutdownPromise = (async () => {
    markRedisQuotaExceeded();
    clearIdlePauseTimer();

    try {
      await closeRegisteredWorker(true);
      logInfo("[WORKER] Closed after Redis quota exceeded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logWarn("[WORKER] Quota shutdown warning", { message });
    }
  })();

  return quotaShutdownPromise;
}

function handleWorkerError(error: Error): void {
  if (isRedisQuotaError(error)) {
    if (!workerErrorLoggedAfterQuota) {
      workerErrorLoggedAfterQuota = true;
      logError("[WORKER] Redis quota exceeded — stopping worker", {
        message: error.message,
      });
    }

    void shutdownOnQuotaExceeded();
    return;
  }

  if (isExpectedWorkerControlError(error)) {
    logInfo("[WORKER] Blocking Redis wait ended during idle pause (expected)", {
      message: error.message,
    });
    return;
  }

  logError("[WORKER] Worker error", { message: error.message });
}

async function updateAssignmentProgress(
  assignmentId: string,
  userId: string,
  progress: number,
): Promise<void> {
  const updated = await Assignment.findOneAndUpdate(
    { _id: assignmentId, ...NOT_DELETED_FILTER },
    { progress },
    { returnDocument: "after" },
  );

  if (!updated) return;

  emitAssignmentProcessing(userId, assignmentId, progress);
}

async function processAssignmentJob(
  job: Job<AssignmentGenerationJobData>,
): Promise<void> {
  const { assignmentId, uploadPaths, ownerUid, ...formData } = job.data;

  if (!assignmentId) {
    throw new Error("Assignment job missing assignmentId");
  }

  const assignment = await findActiveAssignmentByIdInternal(assignmentId);

  if (!assignment) {
    logWarn("[WORKER] Assignment not found or deleted, skipping job", {
      assignmentId,
      jobId: job.id,
    });
    return;
  }

  const userId = assignment.userId ?? ownerUid;

  if (!userId) {
    logWarn("[WORKER] Assignment missing userId, skipping job", {
      assignmentId,
      jobId: job.id,
    });
    return;
  }

  const materialText = formData.materialText ?? assignment.materialText;
  const provider = getAIProvider();

  try {
    assignment.status = "processing";
    assignment.startedAt = assignment.startedAt ?? new Date();
    assignment.progress = 5;
    await assignment.save();
    emitAssignmentProcessing(userId, assignmentId, 5);
    await job.updateProgress(5);

    logInfo("[WORKER] Assignment processing started", {
      assignmentId,
      uid: userId,
      provider: provider.name,
    });

    await updateAssignmentProgress(assignmentId, userId, 20);
    await job.updateProgress(20);

    const aiInput: Parameters<typeof generateAssignmentPaper>[0] = {
      assignmentId,
      title: formData.title,
      topic: formData.topic,
      instructions: formData.instructions,
      questionConfig: formData.questionConfig,
      ...(assignment.examBlueprint
        ? { examBlueprint: assignment.examBlueprint }
        : {}),
      ...(assignment.materialSummary
        ? { materialSummary: assignment.materialSummary }
        : {}),
      ...(assignment.syllabusConcepts?.length
        ? { syllabusConcepts: assignment.syllabusConcepts }
        : {}),
      ...(materialText ? { materialText } : {}),
    };

    const generationResult = await generateAssignmentPaper(aiInput);

    await updateAssignmentProgress(assignmentId, userId, 85);
    await job.updateProgress(85);

    assignment.generatedPaper = generationResult.generatedPaper;
    assignment.answerKey = generationResult.answerKey;
    assignment.answerKeyMode = generationResult.answerKeyMode;
    // BASIC papers ship a complete answer key; richer modes defer solutions
    // until they are requested on demand (Phase 4).
    assignment.solutionsStatus =
      generationResult.answerKeyMode === "BASIC"
        ? "not_applicable"
        : "pending";
    assignment.generationMetrics = generationResult.generationMetrics;
    assignment.status = "completed";
    assignment.progress = 100;
    assignment.completedAt = new Date();
    await assignment.save();
    emitAssignmentCompleted(
      userId,
      assignmentId,
      generationResult.generatedPaper,
    );
    await job.updateProgress(100);

    // Count usage only after a successful, validated completion.
    if (generationResult.generatedPaper) {
      await incrementAssignmentUsage(userId);
      logInfo("[USER] Assignment completed", {
        uid: userId,
        assignmentId,
      });
    }

    logInfo("[WORKER] Assignment completed", {
      assignmentId,
      uid: userId,
      provider: generationResult.generationMetrics.provider,
      durationMs: generationResult.generationMetrics.durationMs,
      retryCount: generationResult.generationMetrics.retryCount,
      promptTokens: generationResult.generationMetrics.promptTokens,
      completionTokens: generationResult.generationMetrics.completionTokens,
      totalTokens: generationResult.generationMetrics.totalTokens,
      thoughtsTokens: generationResult.generationMetrics.thoughtsTokens,
      jobId: job.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const maxAttempts = job.opts.attempts ?? 3;
    const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;
    const failureMetrics =
      error instanceof AssignmentGenerationError
        ? error.metrics
        : {
            provider: provider.name,
            model: provider.model,
            errorCategory: classifyGenerationError(error),
          };

    logError("[WORKER] Job attempt failed", {
      assignmentId,
      jobId: job.id,
      attempt: job.attemptsMade + 1,
      maxAttempts,
      message,
    });

    if (isFinalAttempt) {
      try {
        const failedAssignment =
          await findActiveAssignmentByIdInternal(assignmentId);
        if (failedAssignment) {
          failedAssignment.status = "failed";
          failedAssignment.failureReason = message;
          failedAssignment.generationMetrics = failureMetrics;
          failedAssignment.progress = 0;
          failedAssignment.completedAt = new Date();
          await failedAssignment.save();
          emitAssignmentFailed(userId, assignmentId, message);

          logError("[WORKER] Assignment failed", {
            assignmentId,
            uid: userId,
            provider: failureMetrics.provider,
            ...(failureMetrics.durationMs !== undefined
              ? { durationMs: failureMetrics.durationMs }
              : {}),
            message,
          });
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
  if (isRedisQuotaExceeded()) {
    logWarn("[WORKER] Skipping worker start — Redis quota already exceeded");
    return;
  }

  assignmentWorker = new Worker<AssignmentGenerationJobData>(
    ASSIGNMENT_QUEUE_NAME,
    processAssignmentJob,
    {
      connection: workerConnection,
      autorun: false,
      drainDelay: WORKER_DRAIN_DELAY_SEC,
      skipStalledCheck: WORKER_SKIP_STALLED_CHECK,
    },
  );

  assignmentWorker.on("error", handleWorkerError);

  assignmentWorker.on("failed", (job, error) => {
    logError("[WORKER] Job failed", {
      jobId: job?.id ?? "unknown",
      assignmentId: job?.data.assignmentId,
      message: error.message,
    });
  });

  assignmentWorker.on("drained", () => {
    schedulePauseWhenIdle();
  });

  assignmentWorker.on("active", () => {
    clearIdlePauseTimer();
  });

  registerAssignmentWorker(assignmentWorker);

  await assignmentWorker.waitUntilReady();

  const pending = await assignmentQueue.getJobCounts("wait", "delayed");
  const pendingCount = (pending.wait ?? 0) + (pending.delayed ?? 0);

  if (pendingCount > 0) {
    startWorkerProcessingIfNeeded();
    logInfo("[WORKER] Assignment worker ready", { pendingJobs: pendingCount });
  } else {
    logInfo("[WORKER] Assignment worker ready (idle — no Redis polling until next job)");
  }
}

export async function closeAssignmentWorker(): Promise<void> {
  await closeRegisteredWorker();
  logInfo("[WORKER] Assignment worker closed");
}
