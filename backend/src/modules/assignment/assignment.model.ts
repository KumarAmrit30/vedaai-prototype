import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import {
  ASSIGNMENT_STATUSES,
  DIFFICULTIES,
  DIFFICULTY_LEVELS,
  EXAM_PATTERNS,
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

const answerKeyEntrySchema = new Schema(
  {
    questionNumber: { type: Number, required: true, min: 1 },
    answer: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    markingGuide: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const questionConfigSchema = new Schema(
  {
    questionType: { type: String, required: true, trim: true },
    numberOfQuestions: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 },
    examPattern: { type: String, enum: EXAM_PATTERNS, required: false },
    difficultyLevel: { type: String, enum: DIFFICULTY_LEVELS, required: false },
  },
  { _id: false },
);

const blueprintSectionSchema = new Schema(
  {
    sectionId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    instruction: { type: String, required: true, trim: true },
    questionType: { type: String, required: true, trim: true },
    numberOfQuestions: { type: Number, required: true, min: 1 },
    marksPerQuestion: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const examBlueprintSchema = new Schema(
  {
    examPattern: { type: String, enum: EXAM_PATTERNS, required: true },
    difficultyLevel: { type: String, enum: DIFFICULTY_LEVELS, required: true },
    sections: { type: [blueprintSectionSchema], default: [] },
    totalQuestions: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
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

const generationMetricsSchema = new Schema(
  {
    provider: { type: String, trim: true },
    model: { type: String, trim: true },
    durationMs: { type: Number, min: 0 },
    retryCount: { type: Number, min: 0 },
    errorCategory: { type: String, trim: true },
  },
  { _id: false },
);

const assignmentSchema = new Schema(
  {
    userId: { type: String, required: true, trim: true, index: true },
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
    examBlueprint: { type: examBlueprintSchema, required: false },
    generatedPaper: { type: generatedPaperSchema, required: false },
    answerKey: { type: [answerKeyEntrySchema], required: false },
    jobId: { type: String, trim: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String, trim: true },
    generationMetrics: { type: generationMetricsSchema, required: false },
    materialText: { type: String, trim: true },
    materialSourceType: { type: String, enum: ["pdf", "txt"], required: false },
    originalFileName: { type: String, trim: true },
    materialSource: { type: materialSourceSchema, required: false },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

/** Per-user active listing (newest first). */
assignmentSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });

/** Per-user detail lookups. */
assignmentSchema.index({ userId: 1, _id: 1 });

export type AssignmentDocument = HydratedDocument<AssignmentEntity>;
export type AssignmentModel = Model<AssignmentEntity>;

export const Assignment = mongoose.model<AssignmentEntity>(
  "Assignment",
  assignmentSchema,
);
