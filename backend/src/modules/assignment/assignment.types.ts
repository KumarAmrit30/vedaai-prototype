import type {
  AnswerKeyMode,
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

/**
 * Lifecycle of on-demand solution generation (Phase 4).
 * - not_applicable: BASIC answer-key exams need no separate solutions
 * - pending:        solutions not yet generated
 * - generating:     a generate-solutions job is in flight
 * - completed:      explanations (and rubric/markingGuide) are populated
 * - failed:         the last solution generation attempt failed
 */
export const SOLUTIONS_STATUSES = [
  "not_applicable",
  "pending",
  "generating",
  "completed",
  "failed",
] as const;

export type SolutionsStatus = (typeof SOLUTIONS_STATUSES)[number];

export type {
  AnswerKeyMode,
  BlueprintSectionDefinition,
  DifficultyLevel,
  ExamBlueprint,
  ExamPattern,
} from "./exam-blueprint.types";

export {
  ANSWER_KEY_MODES,
  DIFFICULTY_LEVELS,
  EXAM_PATTERNS,
} from "./exam-blueprint.types";

export interface Question {
  question: string;
  difficulty: Difficulty;
  marks: number;
  /** Present for objective question types (multiple-choice / true-false). */
  options?: string[] | undefined;
}

export interface QuestionSection {
  title: string;
  instruction: string;
  questions: Question[];
  /** Subject / area label carried over from the blueprint section. */
  subject?: string | undefined;
}

export interface GeneratedPaper {
  sections: QuestionSection[];
}

export interface AnswerKeyEntry {
  questionNumber: number;
  answer: string;
  /** Populated on demand for STANDARD / DETAILED modes (Phase 3 + 4). */
  explanation?: string | undefined;
  /** DETAILED mode only. */
  markingGuide?: string | undefined;
  /** DETAILED mode only. */
  rubric?: string | undefined;
}

export interface QuestionConfig {
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  examPattern?: ExamPattern;
  difficultyLevel?: DifficultyLevel;
  answerKeyMode?: AnswerKeyMode;
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
  /** Exam pattern this paper was generated for (telemetry, Phase 7). */
  examType?: string;
  /** Total questions generated (telemetry, Phase 7). */
  questionCount?: number;
  /** Answer-key richness mode used (telemetry, Phase 7). */
  answerKeyMode?: AnswerKeyMode;
  /** Token cost of on-demand solution generation, when run. */
  solutionPromptTokens?: number;
  solutionCompletionTokens?: number;
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
  /** Answer-key richness mode for this paper (Phase 3). */
  answerKeyMode?: AnswerKeyMode;
  /** On-demand solution generation lifecycle (Phase 4). */
  solutionsStatus?: SolutionsStatus;
  jobId?: string;
  progress?: number;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  generationMetrics?: GenerationMetrics;
  materialText?: string;
  /** Compressed topic summary used in prompts instead of raw material (Phase 5). */
  materialSummary?: string;
  /** Key syllabus concepts extracted from the material (Phase 5). */
  syllabusConcepts?: string[];
  materialSourceType?: "pdf" | "txt";
  originalFileName?: string;
  materialSource?: MaterialSource;
  isDeleted?: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
