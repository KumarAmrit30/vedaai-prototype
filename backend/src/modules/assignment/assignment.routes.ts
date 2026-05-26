import { Router } from "express";
import {
  bulkDeleteAssignments,
  bulkUpdateAssignmentStatus,
  createAssignment,
  createAssignmentUploadMiddleware,
  deleteAssignment,
  getAssignmentById,
  getAssignments,
  patchAssignmentStatus,
} from "./assignment.controller";

const assignmentRouter = Router();

assignmentRouter.get("/", getAssignments);
assignmentRouter.post("/bulk-delete", bulkDeleteAssignments);
assignmentRouter.post("/bulk-status", bulkUpdateAssignmentStatus);
assignmentRouter.get("/:id", getAssignmentById);
assignmentRouter.post("/", createAssignmentUploadMiddleware, createAssignment);
assignmentRouter.patch("/:id/status", patchAssignmentStatus);
assignmentRouter.delete("/:id", deleteAssignment);

export default assignmentRouter;
