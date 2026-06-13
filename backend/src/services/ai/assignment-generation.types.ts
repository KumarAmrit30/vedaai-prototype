import type {
  AnswerKeyEntry,
  AnswerKeyMode,
  ExamBlueprint,
  GeneratedPaper,
  GenerationMetrics,
  QuestionConfig,
} from "../../modules/assignment/assignment.types";

export interface AssignmentGenerationInput {
  assignmentId: string;
  title: string;
  topic: string;
  instructions: string;
  questionConfig: QuestionConfig;
  examBlueprint?: ExamBlueprint;
  /** Raw material — used only as a fallback when no summary is available. */
  materialText?: string;
  /** Compressed topic summary (Phase 5) — preferred over raw material. */
  materialSummary?: string;
  /** Extracted syllabus concepts (Phase 5). */
  syllabusConcepts?: string[];
}

export interface AssignmentGenerationResult {
  generatedPaper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
  /** Answer-key mode that governs on-demand solution generation (Phase 3/4). */
  answerKeyMode: AnswerKeyMode;
  generationMetrics: GenerationMetrics;
}
