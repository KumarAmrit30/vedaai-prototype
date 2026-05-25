import { Router } from "express";
import {
  createAssignment,
  getAssignmentById,
  getAssignments,
} from "./assignment.controller";

const assignmentRouter = Router();

assignmentRouter.get("/", getAssignments);
assignmentRouter.get("/:id", getAssignmentById);
assignmentRouter.post("/", createAssignment);

export default assignmentRouter;
