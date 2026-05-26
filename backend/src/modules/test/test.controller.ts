import type { NextFunction, Request, Response } from "express";
import { assignmentQueue } from "../../queues/assignment.queue";

export async function createTestJob(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const job = await assignmentQueue.add("test-assignment", {
      assignmentId: "test-assignment-id",
      title: "Test Assignment",
      topic: "DBMS",
      dueDate: new Date().toISOString(),
      instructions: "Test assignment generation",
      questionConfig: {
        questionType: "short-answer",
        numberOfQuestions: 3,
        marksPerQuestion: 2,
      },
      metadata: { source: "test-job" },
    });

    res.json({
      success: true,
      message: "Test job added successfully",
      jobId: job.id,
    });
  } catch (error) {
    next(error);
  }
}
