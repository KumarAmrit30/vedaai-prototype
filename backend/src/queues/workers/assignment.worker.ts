import { Worker, type Job } from "bullmq";
import { Assignment } from "../../modules/assignment/assignment.model";
import { generateContent } from "../../services/ai/gemini.service";
import { buildTestPrompt } from "../../services/ai/prompt-builder";
import { parseAIResponse } from "../../services/ai/response-parser";
import { redis } from "../../redis/client";

interface AssignmentJobData {
  assignmentId: string;
  topic?: string;
}

export let assignmentWorker: Worker<AssignmentJobData>;

async function processAssignmentJob(job: Job<AssignmentJobData>): Promise<void> {
  const { assignmentId } = job.data;

  if (!assignmentId) {
    throw new Error("Assignment job missing assignmentId");
  }

  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new Error(`Assignment not found: ${assignmentId}`);
  }

  try {
    assignment.status = "generating";
    await assignment.save();

    const prompt = buildTestPrompt();
    const rawResponse = await generateContent(prompt);
    const validatedOutput = parseAIResponse(rawResponse);

    assignment.generatedPaper = validatedOutput;
    assignment.status = "completed";
    await assignment.save();

    console.log(`Assignment generation completed: ${assignmentId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Assignment job processing failed:", message);

    try {
      assignment.status = "failed";
      await assignment.save();
    } catch (saveError) {
      const saveMessage =
        saveError instanceof Error ? saveError.message : "Unknown save error";
      console.error("Failed to persist failed assignment status:", saveMessage);
    }

    throw error instanceof Error ? error : new Error(message);
  }
}

export async function startAssignmentWorker(): Promise<void> {
  assignmentWorker = new Worker<AssignmentJobData>(
    "assignment-generation",
    processAssignmentJob,
    {
      connection: redis.duplicate({
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      }),
    },
  );

  assignmentWorker.on("error", (error: Error) => {
    console.error("Assignment worker error:", error.message);
  });

  assignmentWorker.on("failed", (job, error) => {
    console.error(
      "Assignment job failed:",
      job?.id ?? "unknown",
      error.message,
    );
  });

  await assignmentWorker.waitUntilReady();
}
