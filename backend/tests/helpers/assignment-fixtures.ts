import { Types } from "mongoose";
import type { AssignmentDocument } from "../../src/modules/assignment/assignment.model";

const ASSIGNMENT_ID = new Types.ObjectId();

export const USER_A = "user-a";
export const USER_B = "user-b";

export function buildAssignmentFixture(
  ownerId: string = USER_A,
): AssignmentDocument {
  const assignmentData = {
    _id: ASSIGNMENT_ID,
    userId: ownerId,
    title: "Midterm Review",
    topic: "Biology",
    dueDate: new Date("2026-06-15T00:00:00.000Z"),
    instructions: "Answer all questions.",
    status: "completed" as const,
    questionConfig: {
      questionType: "short-answer",
      numberOfQuestions: 2,
      marksPerQuestion: 2,
    },
    progress: 100,
    isDeleted: false,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
  };

  return {
    ...assignmentData,
    toObject: () => ({ ...assignmentData }),
    save: jest.fn().mockResolvedValue(undefined),
  } as unknown as AssignmentDocument;
}

export function getFixtureAssignmentId(): string {
  return ASSIGNMENT_ID.toString();
}
