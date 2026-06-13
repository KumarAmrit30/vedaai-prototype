import { ASSIGNMENT_STATUS } from "@/lib/constants";
import type {
  DifficultyLevel,
  ExamPattern,
} from "@/lib/constants/exam-blueprint";

export type AssignmentStatus =
  (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export type Difficulty = "easy" | "medium" | "hard";

export interface BlueprintSectionDefinition {
  sectionId: string;
  title: string;
  instruction: string;
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface ExamBlueprint {
  examPattern: ExamPattern;
  difficultyLevel: DifficultyLevel;
  sections: BlueprintSectionDefinition[];
  totalQuestions: number;
  totalMarks: number;
}

export interface Question {
  question: string;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
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
  totalMarks?: number;
  examPattern?: ExamPattern;
  difficultyLevel?: DifficultyLevel;
}

export interface MaterialSource {
  fileName: string;
  fileType: "pdf" | "txt";
  fileSize: number;
  charCount: number;
}

export interface Assignment {
  _id: string;
  title: string;
  topic: string;
  dueDate: string;
  instructions: string;
  status: AssignmentStatus;
  questionConfig: QuestionConfig;
  examBlueprint?: ExamBlueprint;
  generatedPaper?: GeneratedPaper;
  answerKey?: AnswerKeyEntry[];
  materialSource?: MaterialSource;
  materialSourceType?: "pdf" | "txt";
  originalFileName?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}
