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
  },
  { timestamps: true },
);

export type AssignmentDocument = HydratedDocument<AssignmentEntity>;
export type AssignmentModel = Model<AssignmentEntity>;

export const Assignment = mongoose.model<AssignmentEntity>(
  "Assignment",
  assignmentSchema,
);
