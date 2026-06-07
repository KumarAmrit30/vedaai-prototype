import type { NextFunction, Request, Response } from "express";
import {
  getUploadedFilePaths,
  uploadMaterials,
} from "../../middleware/upload.middleware";
import { uploadErrorHandler, isMaterialUploadError } from "../../middleware/uploadErrorHandler";
import {
  enqueueAssignmentGeneration,
  type AssignmentGenerationJobData,
} from "../../queues/assignment.queue";
import {
  deleteUploadedFiles,
  parseMaterialFiles,
} from "../../services/material-parser.service";
import {
  emitAssignmentDeleted,
  emitAssignmentUpdated,
  type AssignmentUpdatedPayload,
} from "../../socket/assignment.socket";
import { normalizeAssignmentStatus } from "./assignment.status";
import { MANUAL_ASSIGNMENT_STATUSES } from "./assignment.constants";
import { Assignment } from "./assignment.model";
import {
  findActiveAssignmentById,
  findActiveAssignments,
  findActiveAssignmentsByIds,
  NOT_DELETED_FILTER,
} from "./assignment.queries";
import {
  serializeAssignment,
  serializeAssignments,
} from "./assignment.serializer";
import {
  findUserByFirebaseUid,
  incrementAssignmentUsage,
  upsertUserFromFirebaseClaims,
} from "../user/user.service";
import { PLAN_ASSIGNMENT_LIMITS } from "../user/user.types";
import type { MaterialSource, QuestionConfig, GeneratedPaper } from "./assignment.types";
import type { ManualAssignmentStatus } from "./assignment.constants";

interface CreateAssignmentBody {
  title: string;
  topic: string;
  dueDate: string | Date;
  instructions: string;
  questionConfig: QuestionConfig | string;
  materialText?: string;
  uploadedMaterialText?: string;
}

interface BulkDeleteBody {
  assignmentIds: string[];
}

interface BulkStatusBody {
  assignmentIds: string[];
  status: ManualAssignmentStatus;
}

interface PatchStatusBody {
  status: ManualAssignmentStatus;
}

function parseQuestionConfig(value: QuestionConfig | string): QuestionConfig {
  if (typeof value === "string") {
    return JSON.parse(value) as QuestionConfig;
  }

  return value;
}

function parseAssignmentIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function isManualStatus(value: unknown): value is ManualAssignmentStatus {
  return (
    typeof value === "string" &&
    MANUAL_ASSIGNMENT_STATUSES.includes(value as ManualAssignmentStatus)
  );
}

function getRouteParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

function buildUpdatedSocketPayload(assignment: {
  _id: { toString(): string };
  status: string;
  progress?: number;
  generatedPaper?: GeneratedPaper;
}): AssignmentUpdatedPayload {
  const payload: AssignmentUpdatedPayload = {
    assignmentId: assignment._id.toString(),
    status: normalizeAssignmentStatus(assignment.status),
  };

  if (assignment.progress !== undefined) {
    payload.progress = assignment.progress;
  }

  if (assignment.generatedPaper) {
    payload.generatedPaper = assignment.generatedPaper;
  }

  return payload;
}

export async function createAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const uploadPaths = getUploadedFilePaths(
    req.files as Express.Multer.File[] | undefined,
  );

  try {
    // Enforce free-plan generation limits for authenticated users. When auth is
    // disabled (local dev), req.auth is absent and no limit applies.
    if (req.auth?.uid) {
      const user =
        (await findUserByFirebaseUid(req.auth.uid)) ??
        (await upsertUserFromFirebaseClaims(req.auth));

      const limit = PLAN_ASSIGNMENT_LIMITS[user.plan];

      if (user.usage.assignmentsGenerated >= limit) {
        res.status(403).json({
          success: false,
          message: "Free plan limit reached. Upgrade required.",
        });
        return;
      }
    }

    const {
      title,
      topic,
      dueDate,
      instructions,
      questionConfig: rawQuestionConfig,
      materialText: bodyMaterialText,
      uploadedMaterialText,
    } = req.body as CreateAssignmentBody;

    const questionConfig = parseQuestionConfig(rawQuestionConfig);
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;

    let materialText = bodyMaterialText ?? uploadedMaterialText;
    let materialSource: MaterialSource | undefined;
    let materialSourceType: "pdf" | "txt" | undefined;
    let originalFileName: string | undefined;

    if (uploadedFiles?.length) {
      const parsed = await parseMaterialFiles(uploadedFiles);
      materialText = parsed.materialText;
      materialSource = parsed.materialSource;
      materialSourceType = parsed.materialSourceType;
      originalFileName = parsed.originalFileName;
    }

    const assignment = await Assignment.create({
      title,
      topic,
      dueDate,
      instructions,
      questionConfig,
      status: "pending",
      progress: 0,
      isDeleted: false,
      ...(materialText ? { materialText } : {}),
      ...(materialSourceType ? { materialSourceType } : {}),
      ...(originalFileName ? { originalFileName } : {}),
      ...(materialSource ? { materialSource } : {}),
    });

    // Count only successful creations against the user's quota.
    if (req.auth?.uid) {
      await incrementAssignmentUsage(req.auth.uid);
    }

    const jobPayload: AssignmentGenerationJobData = {
      assignmentId: assignment._id.toString(),
      title: assignment.title,
      topic: assignment.topic,
      dueDate: assignment.dueDate.toISOString(),
      instructions: assignment.instructions,
      questionConfig: assignment.questionConfig,
      metadata: {
        createdAt: assignment.createdAt.toISOString(),
        ...(materialSource ? { materialSource } : {}),
      },
      ...(materialText ? { materialText } : {}),
      ...(uploadPaths.length ? { uploadPaths } : {}),
    };

    const jobId = await enqueueAssignmentGeneration(jobPayload);

    assignment.jobId = jobId;
    await assignment.save();

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignmentId: assignment._id.toString(),
      jobId,
      status: "pending",
      data: serializeAssignment(assignment),
    });
  } catch (error) {
    if (isMaterialUploadError(error)) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    next(error);
  } finally {
    if (uploadPaths.length > 0) {
      await deleteUploadedFiles(uploadPaths);
    }
  }
}

export function createAssignmentUploadMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  uploadMaterials.array("materials", 3)(req, res, (error) => {
    if (error) {
      uploadErrorHandler(error, req, res, next);
      return;
    }

    next();
  });
}

export async function getAssignments(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assignments = await findActiveAssignments();

    res.json({
      success: true,
      data: serializeAssignments(assignments),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssignmentById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid assignment id" });
      return;
    }

    const assignment = await findActiveAssignmentById(id);

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    res.json({
      success: true,
      data: serializeAssignment(assignment),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAssignment(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getRouteParam(req.params.id);

    if (!id) {
      res.status(400).json({ success: false, message: "Invalid assignment id" });
      return;
    }

    const assignment = await findActiveAssignmentById(id);

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    assignment.isDeleted = true;
    assignment.deletedAt = new Date();
    await assignment.save();

    const assignmentId = assignment._id.toString();
    emitAssignmentDeleted({ assignmentId });

    res.json({
      success: true,
      message: "Assignment deleted",
      assignmentId,
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkDeleteAssignments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { assignmentIds } = req.body as BulkDeleteBody;
    const ids = parseAssignmentIds(assignmentIds);

    if (ids.length === 0) {
      res.status(400).json({
        success: false,
        message: "assignmentIds must be a non-empty array",
      });
      return;
    }

    const deletedAt = new Date();
    const result = await Assignment.updateMany(
      { _id: { $in: ids }, ...NOT_DELETED_FILTER },
      { $set: { isDeleted: true, deletedAt } },
    );

    ids.forEach((assignmentId) => {
      emitAssignmentDeleted({ assignmentId });
    });

    res.json({
      success: true,
      message: "Assignments deleted",
      deletedCount: result.modifiedCount,
      assignmentIds: ids,
    });
  } catch (error) {
    next(error);
  }
}

export async function patchAssignmentStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = getRouteParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid assignment id" });
      return;
    }

    const { status } = req.body as PatchStatusBody;

    if (!isManualStatus(status)) {
      res.status(400).json({
        success: false,
        message: 'status must be one of: "pending", "completed", "failed"',
      });
      return;
    }

    const assignment = await findActiveAssignmentById(id);

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    assignment.status = status;
    await assignment.save();

    emitAssignmentUpdated(buildUpdatedSocketPayload(assignment));

    res.json({
      success: true,
      data: serializeAssignment(assignment),
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateAssignmentStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { assignmentIds, status } = req.body as BulkStatusBody;
    const ids = parseAssignmentIds(assignmentIds);

    if (ids.length === 0) {
      res.status(400).json({
        success: false,
        message: "assignmentIds must be a non-empty array",
      });
      return;
    }

    if (!isManualStatus(status)) {
      res.status(400).json({
        success: false,
        message: 'status must be one of: "pending", "completed", "failed"',
      });
      return;
    }

    const result = await Assignment.updateMany(
      { _id: { $in: ids }, ...NOT_DELETED_FILTER },
      { $set: { status } },
    );

    const updatedAssignments = await findActiveAssignmentsByIds(ids);

    updatedAssignments.forEach((assignment) => {
      emitAssignmentUpdated(buildUpdatedSocketPayload(assignment));
    });

    res.json({
      success: true,
      message: "Assignment statuses updated",
      updatedCount: result.modifiedCount,
      data: serializeAssignments(updatedAssignments),
    });
  } catch (error) {
    next(error);
  }
}
