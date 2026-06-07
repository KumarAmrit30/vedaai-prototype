import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import {
  ASSIGNMENT_STATUSES,
  DIFFICULTIES,
  type Assignment as AssignmentEntity,
} from "./assignment.types";

const questionSchema = new Schema(
  {
    question: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    marks: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const questionSectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    instruction: { type: String, required: true, trim: true },
    questions: { type: [questionSchema], default: [] },
  },
  { _id: false },
);

const generatedPaperSchema = new Schema(
  {
    sections: { type: [questionSectionSchema], default: [] },
  },
  { _id: false },
);

const questionConfigSchema = new Schema(
  {
    questionType: { type: String, required: true, trim: true },
    numberOfQuestions: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const materialSourceSchema = new Schema(
  {
    fileName: { type: String, required: true, trim: true },
    fileType: { type: String, enum: ["pdf", "txt"], required: true },
    fileSize: { type: Number, required: true, min: 0 },
    charCount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    instructions: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUSES,
      required: true,
      default: "pending",
    },
    questionConfig: { type: questionConfigSchema, required: true },
    generatedPaper: { type: generatedPaperSchema, required: false },
    jobId: { type: String, trim: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String, trim: true },
    materialText: { type: String, trim: true },
    materialSourceType: { type: String, enum: ["pdf", "txt"], required: false },
    originalFileName: { type: String, trim: true },
    materialSource: { type: materialSourceSchema, required: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

/**
 * Active assignment listing (newest first).
 * Supports findActiveAssignments() in assignment.queries.ts:
 *   find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 })
 * Lets MongoDB filter by isDeleted and return results in createdAt order
 * without an in-memory sort stage.
 */
assignmentSchema.index({ isDeleted: 1, createdAt: -1 });

export type AssignmentDocument = HydratedDocument<AssignmentEntity>;
export type AssignmentModel = Model<AssignmentEntity>;

export const Assignment = mongoose.model<AssignmentEntity>(
  "Assignment",
  assignmentSchema,
);
