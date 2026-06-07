import type { GeneratedPaper, AssignmentStatus } from "@/types/assignment";

export interface AssignmentSocketPayload {
  assignmentId: string;
  status: "processing" | "completed" | "failed";
  progress: number;
  generatedPaper?: GeneratedPaper;
  failureReason?: string;
}

export interface AssignmentUpdatedPayload {
  assignmentId: string;
  status?: AssignmentStatus;
  progress?: number;
  generatedPaper?: GeneratedPaper;
}

export interface AssignmentDeletedPayload {
  assignmentId: string;
}
