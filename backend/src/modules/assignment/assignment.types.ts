export const ASSIGNMENT_STATUSES = [
  "pending",
  "generating",
  "completed",
  "failed",
] as const;

export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

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

export interface Assignment {
  title: string;
  topic: string;
  dueDate: Date;
  instructions: string;
  status: AssignmentStatus;
  questionConfig: QuestionConfig;
  generatedPaper?: GeneratedPaper;
  createdAt: Date;
  updatedAt: Date;
}
