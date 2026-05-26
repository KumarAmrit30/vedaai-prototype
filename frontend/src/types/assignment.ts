import { ASSIGNMENT_STATUS } from "@/lib/constants";

export type AssignmentStatus =
  (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS];

export type Difficulty = "easy" | "medium" | "hard";

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

export interface QuestionConfig {
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
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
  generatedPaper?: GeneratedPaper;
  materialSource?: MaterialSource;
  materialSourceType?: "pdf" | "txt";
  originalFileName?: string;
  progress?: number;
  createdAt: string;
  updatedAt: string;
}
