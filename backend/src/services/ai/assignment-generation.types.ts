import type {
  AnswerKeyEntry,
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
  materialText?: string;
}

export interface AssignmentGenerationResult {
  generatedPaper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
  generationMetrics: GenerationMetrics;
}
