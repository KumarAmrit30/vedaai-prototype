import type {
  DifficultyLevel,
  ExamBlueprint,
  ExamPattern,
} from "./exam-blueprint.types";

export const ASSIGNMENT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export type {
  BlueprintSectionDefinition,
  DifficultyLevel,
  ExamBlueprint,
  ExamPattern,
} from "./exam-blueprint.types";

export {
  DIFFICULTY_LEVELS,
  EXAM_PATTERNS,
} from "./exam-blueprint.types";

export interface Question {
  question: string;
  difficulty: Difficulty;
  marks: number;
}

export interface QuestionSection {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface GeneratedPaper {
  sections: QuestionSection[];
}

export interface AnswerKeyEntry {
  questionNumber: number;
  answer: string;
  explanation: string;
  markingGuide: string;
}

export interface QuestionConfig {
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  examPattern?: ExamPattern;
  difficultyLevel?: DifficultyLevel;
}

export interface MaterialSource {
  fileName: string;
  fileType: "pdf" | "txt";
  fileSize: number;
  charCount: number;
}

export interface GenerationMetrics {
  provider?: string;
  model?: string;
  durationMs?: number;
  retryCount?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  thoughtsTokens?: number;
  errorCategory?: string;
}

export interface Assignment {
  userId: string;
  title: string;
  topic: string;
  dueDate: Date;
  instructions: string;
  status: AssignmentStatus;
  questionConfig: QuestionConfig;
  examBlueprint?: ExamBlueprint;
  generatedPaper?: GeneratedPaper;
  answerKey?: AnswerKeyEntry[];
  jobId?: string;
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  generationMetrics?: GenerationMetrics;
  materialText?: string;
  materialSourceType?: "pdf" | "txt";
  originalFileName?: string;
  materialSource?: MaterialSource;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
