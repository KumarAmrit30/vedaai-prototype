import type { NextFunction, Request, Response } from "express";
import { assignmentQueue } from "../../queues/assignment.queue";
import { Assignment } from "./assignment.model";
import type { QuestionConfig } from "./assignment.types";

interface CreateAssignmentBody {
  title: string;
  topic: string;
  dueDate: string | Date;
  instructions: string;
  questionConfig: QuestionConfig;
}

export async function createAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { title, topic, dueDate, instructions, questionConfig } =
      req.body as CreateAssignmentBody;

    const assignment = await Assignment.create({
      title,
      topic,
      dueDate,
      instructions,
      questionConfig,
      status: "pending",
    });

    await assignmentQueue.add("generate-assignment", {
      assignmentId: assignment._id.toString(),
      topic: assignment.topic,
    });

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssignments(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssignmentById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
}
