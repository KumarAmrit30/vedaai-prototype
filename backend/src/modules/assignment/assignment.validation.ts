import { z } from "zod";
import {
  questionConfigSchema,
} from "./exam-blueprint.validation";

export { QUESTION_TYPES } from "./assignment.constants";
export {
  questionConfigSchema,
  resolveAssignmentConfig,
  type ValidatedQuestionConfig,
  type ResolvedAssignmentConfig,
} from "./exam-blueprint.validation";

export const ASSIGNMENT_STATUS_VALUES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

const mongoObjectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

function parseQuestionConfigInput(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }

  return value;
}

const questionConfigField = z.preprocess(
  parseQuestionConfigInput,
  questionConfigSchema,
);

const validDateString = z
  .string()
  .min(1, "dueDate is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "dueDate must be a valid date string",
  });

export const createAssignmentSchema = z.object({
  title: z
    .string()
    .min(3, "title must be at least 3 characters")
    .max(200, "title must be at most 200 characters"),
  topic: z
    .string()
    .min(2, "topic must be at least 2 characters")
    .max(200, "topic must be at most 200 characters"),
  instructions: z
    .string()
    .min(1, "instructions are required")
    .max(5000, "instructions must be at most 5000 characters"),
  dueDate: validDateString,
  questionConfig: questionConfigField,
  materialText: z.string().max(50_000).optional(),
  uploadedMaterialText: z.string().max(50_000).optional(),
});

export const bulkDeleteSchema = z.object({
  assignmentIds: z
    .array(mongoObjectIdSchema)
    .min(1, "assignmentIds must contain at least 1 id")
    .max(100, "assignmentIds must contain at most 100 ids"),
});

export const bulkStatusSchema = z.object({
  assignmentIds: z
    .array(mongoObjectIdSchema)
    .min(1, "assignmentIds must contain at least 1 id")
    .max(100, "assignmentIds must contain at most 100 ids"),
  status: z.enum(ASSIGNMENT_STATUS_VALUES, {
    message: "status must be a valid assignment status",
  }),
});

export const patchStatusSchema = z.object({
  status: z.enum(ASSIGNMENT_STATUS_VALUES, {
    message: "status must be a valid assignment status",
  }),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type BulkStatusInput = z.infer<typeof bulkStatusSchema>;
export type PatchStatusInput = z.infer<typeof patchStatusSchema>;
