import { Router } from "express";
import { assignmentCreationRateLimit } from "../../middleware/assignment-rate-limit";
import { verifyFirebaseToken } from "../../middleware/firebase-auth";
import { validateRequest } from "../../middleware/validate-request";
import {
  bulkDeleteAssignments,
  bulkUpdateAssignmentStatus,
  createAssignment,
  createAssignmentUploadMiddleware,
  deleteAssignment,
  generateSolutions,
  getAssignmentById,
  getAssignments,
  patchAssignmentStatus,
} from "./assignment.controller";
import {
  bulkDeleteSchema,
  bulkStatusSchema,
  createAssignmentSchema,
  patchStatusSchema,
} from "./assignment.validation";

const assignmentRouter = Router();

assignmentRouter.use(verifyFirebaseToken);

assignmentRouter.get("/", getAssignments);
assignmentRouter.post(
  "/bulk-delete",
  validateRequest(bulkDeleteSchema),
  bulkDeleteAssignments,
);
assignmentRouter.post(
  "/bulk-status",
  validateRequest(bulkStatusSchema),
  bulkUpdateAssignmentStatus,
);
assignmentRouter.get("/:id", getAssignmentById);
assignmentRouter.post(
  "/",
  assignmentCreationRateLimit,
  createAssignmentUploadMiddleware,
  validateRequest(createAssignmentSchema),
  createAssignment,
);
assignmentRouter.patch(
  "/:id/status",
  validateRequest(patchStatusSchema),
  patchAssignmentStatus,
);
assignmentRouter.post("/:id/generate-solutions", generateSolutions);
assignmentRouter.delete("/:id", deleteAssignment);

export default assignmentRouter;
