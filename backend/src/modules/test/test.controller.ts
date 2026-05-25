import type { NextFunction, Request, Response } from "express";
import { assignmentQueue } from "../../queues/assignment.queue";

export async function createTestJob(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await assignmentQueue.add("test-assignment", {
      topic: "DBMS",
      message: "Test assignment generation",
    });

    res.json({
      success: true,
      message: "Test job added successfully",
    });
  } catch (error) {
    next(error);
  }
}
