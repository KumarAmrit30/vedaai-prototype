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
import { QueueUnavailableError } from "../../queues/queue-unavailable.error";
import {
  deleteUploadedFiles,
  parseMaterialFiles,
} from "../../services/material-parser.service";
import { compressMaterial } from "../../services/material-compression.service";
import { generateAssignmentSolutions } from "../../services/ai/solutions.service";
import { AssignmentGenerationError } from "../../services/ai/generation-metrics";
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
  userScopedFilter,
} from "./assignment.queries";
import {
  serializeAssignment,
  serializeAssignments,
} from "./assignment.serializer";
import {
  findUserByFirebaseUid,
  upsertUserFromFirebaseClaims,
} from "../user/user.service";
import { checkGenerationEligibility } from "../user/plan-eligibility.service";
import { logInfo, logError } from "../../utils/logger";
import type {
  AnswerKeyMode,
  GeneratedPaper,
  GenerationMetrics,
  MaterialSource,
} from "./assignment.types";
import { resolveAssignmentConfig, questionConfigSchema } from "./exam-blueprint.validation";
import type { ValidatedQuestionConfig } from "./exam-blueprint.validation";
import type { ManualAssignmentStatus } from "./assignment.constants";

interface CreateAssignmentBody {
  title: string;
  topic: string;
  dueDate: string | Date;
  instructions: string;
  questionConfig: ValidatedQuestionConfig | string;
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

function assignmentHasGeneratedPaper(
  generatedPaper?: GeneratedPaper | null,
): boolean {
  return Boolean(
    generatedPaper?.sections?.some((section) => section.questions.length > 0),
  );
}

function parseQuestionConfig(
  value: ValidatedQuestionConfig | string,
): ValidatedQuestionConfig {
  if (typeof value === "string") {
    return JSON.parse(value) as ValidatedQuestionConfig;
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

function resolveRequestUserId(req: Request, res: Response): string | null {
  if (!req.auth?.uid) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return null;
  }

  return req.auth.uid;
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
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

    // Enforce plan limits against completed + pending + processing assignments
    // so queued jobs cannot bypass the cap before any of them complete.
    if (req.auth?.uid) {
      const user =
        (await findUserByFirebaseUid(req.auth.uid)) ??
        (await upsertUserFromFirebaseClaims(req.auth));

      const eligibility = await checkGenerationEligibility(user);

      if (!eligibility.allowed) {
        logInfo("[USER] Plan generation limit reached", {
          uid: req.auth.uid,
          completed: eligibility.completedCount,
          inFlight: eligibility.inFlightCount,
          limit: eligibility.limit,
        });
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
      questionConfig: rawQuestionConfigInput,
      materialText: bodyMaterialText,
      uploadedMaterialText,
    } = req.body as CreateAssignmentBody;

    const validatedQuestionConfig = questionConfigSchema.parse(
      parseQuestionConfig(rawQuestionConfigInput),
    );
    const { questionConfig, examBlueprint } = resolveAssignmentConfig(
      validatedQuestionConfig,
    );
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

    // Phase 5 — compress material once at creation so every generation prompt
    // uses a compact summary + syllabus concepts instead of the full text.
    let materialSummary: string | undefined;
    let syllabusConcepts: string[] | undefined;

    if (materialText?.trim()) {
      const compressed = compressMaterial(materialText);
      materialSummary = compressed.summary || undefined;
      syllabusConcepts =
        compressed.concepts.length > 0 ? compressed.concepts : undefined;

      logInfo("[MATERIAL] Compressed for generation", {
        originalChars: compressed.originalChars,
        compressedChars: compressed.compressedChars,
        reductionPct: Math.round(compressed.reductionRatio * 100),
        concepts: compressed.concepts.length,
      });
    }

    const assignment = await Assignment.create({
      userId,
      title,
      topic,
      dueDate,
      instructions,
      questionConfig,
      examBlueprint,
      answerKeyMode: examBlueprint.answerKeyMode,
      status: "pending",
      progress: 0,
      isDeleted: false,
      ...(materialText ? { materialText } : {}),
      ...(materialSummary ? { materialSummary } : {}),
      ...(syllabusConcepts ? { syllabusConcepts } : {}),
      ...(materialSourceType ? { materialSourceType } : {}),
      ...(originalFileName ? { originalFileName } : {}),
      ...(materialSource ? { materialSource } : {}),
    });

    logInfo("[USER] Assignment created", {
      uid: userId,
      assignmentId: assignment._id.toString(),
      topic: assignment.topic,
    });

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
      ownerUid: userId,
    };

    try {
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
    } catch (enqueueError) {
      await Assignment.deleteOne({ _id: assignment._id });

      if (enqueueError instanceof QueueUnavailableError) {
        throw enqueueError;
      }

      throw new QueueUnavailableError();
    }
  } catch (error) {
    if (isMaterialUploadError(error)) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof QueueUnavailableError) {
      res.status(error.statusCode).json({
        success: false,
        code: error.code,
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
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

    const assignments = await findActiveAssignments(userId);

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
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

    const id = getRouteParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid assignment id" });
      return;
    }

    const assignment = await findActiveAssignmentById(id, userId);

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

function resolveAssignmentAnswerKeyMode(assignment: {
  answerKeyMode?: AnswerKeyMode;
  examBlueprint?: { answerKeyMode?: AnswerKeyMode };
}): AnswerKeyMode {
  return (
    assignment.answerKeyMode ??
    assignment.examBlueprint?.answerKeyMode ??
    "STANDARD"
  );
}

/**
 * POST /assignments/:id/generate-solutions
 *
 * Generates explanations (and, for DETAILED mode, marking guides + rubrics)
 * for an already-generated paper on demand (Phase 4). BASIC answer-key exams
 * need no separate solutions and short-circuit.
 */
export async function generateSolutions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

    const id = getRouteParam(req.params.id);
    if (!id) {
      res.status(400).json({ success: false, message: "Invalid assignment id" });
      return;
    }

    const assignment = await findActiveAssignmentById(id, userId);

    if (!assignment) {
      res.status(404).json({ success: false, message: "Assignment not found" });
      return;
    }

    if (
      assignment.status !== "completed" ||
      !assignment.generatedPaper ||
      !assignment.answerKey?.length
    ) {
      res.status(409).json({
        success: false,
        message: "Solutions can only be generated after the paper is completed.",
      });
      return;
    }

    const answerKeyMode = resolveAssignmentAnswerKeyMode(assignment);

    if (answerKeyMode === "BASIC") {
      assignment.solutionsStatus = "not_applicable";
      await assignment.save();
      res.json({
        success: true,
        message: "BASIC answer-key exams do not require generated solutions.",
        data: serializeAssignment(assignment),
      });
      return;
    }

    if (assignment.solutionsStatus === "generating") {
      res.status(409).json({
        success: false,
        message: "Solution generation is already in progress.",
      });
      return;
    }

    if (assignment.solutionsStatus === "completed") {
      res.json({
        success: true,
        message: "Solutions already generated.",
        data: serializeAssignment(assignment),
      });
      return;
    }

    assignment.solutionsStatus = "generating";
    await assignment.save();

    try {
      const result = await generateAssignmentSolutions({
        assignmentId: assignment._id.toString(),
        title: assignment.title,
        topic: assignment.topic,
        instructions: assignment.instructions,
        answerKeyMode,
        generatedPaper: assignment.generatedPaper,
        answerKey: assignment.answerKey,
      });

      assignment.answerKey = result.answerKey;
      assignment.solutionsStatus = "completed";

      const existingMetrics: GenerationMetrics =
        assignment.generationMetrics ?? {};
      assignment.generationMetrics = {
        ...existingMetrics,
        ...(result.promptTokens !== undefined
          ? { solutionPromptTokens: result.promptTokens }
          : {}),
        ...(result.completionTokens !== undefined
          ? { solutionCompletionTokens: result.completionTokens }
          : {}),
      };

      await assignment.save();

      emitAssignmentUpdated(userId, buildUpdatedSocketPayload(assignment));

      logInfo("[TELEMETRY][SOLUTIONS]", {
        assignmentId: assignment._id.toString(),
        answerKeyMode,
        solutionPromptTokens: result.promptTokens,
        solutionCompletionTokens: result.completionTokens,
        retryCount: result.retryCount,
      });

      res.json({
        success: true,
        message: "Solutions generated.",
        data: serializeAssignment(assignment),
      });
    } catch (generationError) {
      assignment.solutionsStatus = "failed";
      await assignment.save();

      const message =
        generationError instanceof Error
          ? generationError.message
          : "Solution generation failed";

      logError("[SOLUTIONS] Generation failed", {
        assignmentId: assignment._id.toString(),
        message,
      });

      if (generationError instanceof AssignmentGenerationError) {
        res.status(502).json({
          success: false,
          message: "Solution generation failed. Please try again.",
        });
        return;
      }

      next(generationError);
    }
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
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

    const id = getRouteParam(req.params.id);

    if (!id) {
      res.status(400).json({ success: false, message: "Invalid assignment id" });
      return;
    }

    const assignment = await findActiveAssignmentById(id, userId);

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
    emitAssignmentDeleted(userId, { assignmentId });

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
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

    const { assignmentIds } = req.body as BulkDeleteBody;
    const ids = parseAssignmentIds(assignmentIds);

    if (ids.length === 0) {
      res.status(400).json({
        success: false,
        message: "assignmentIds must be a non-empty array",
      });
      return;
    }

    const owned = await findActiveAssignmentsByIds(ids, userId);

    if (owned.length !== ids.length) {
      res.status(404).json({
        success: false,
        message: "One or more assignments not found",
      });
      return;
    }

    const deletedAt = new Date();
    const result = await Assignment.updateMany(
      { _id: { $in: ids }, ...userScopedFilter(userId) },
      { $set: { isDeleted: true, deletedAt } },
    );

    owned.forEach((assignment) => {
      emitAssignmentDeleted(userId, {
        assignmentId: assignment._id.toString(),
      });
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
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

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

    const assignment = await findActiveAssignmentById(id, userId);

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
      return;
    }

    if (
      status === "completed" &&
      !assignmentHasGeneratedPaper(assignment.generatedPaper)
    ) {
      res.status(409).json({
        success: false,
        message:
          "Assignments without a generated paper cannot be marked completed.",
      });
      return;
    }

    assignment.status = status;
    await assignment.save();

    emitAssignmentUpdated(userId, buildUpdatedSocketPayload(assignment));

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
    const userId = resolveRequestUserId(req, res);
    if (!userId) return;

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

    const owned = await findActiveAssignmentsByIds(ids, userId);

    if (owned.length !== ids.length) {
      res.status(404).json({
        success: false,
        message: "One or more assignments not found",
      });
      return;
    }

    if (status === "completed") {
      const ineligible = owned.filter(
        (assignment) => !assignmentHasGeneratedPaper(assignment.generatedPaper),
      );

      if (ineligible.length > 0) {
        res.status(409).json({
          success: false,
          message:
            "One or more assignments cannot be marked completed because they have no generated paper.",
          ineligibleIds: ineligible.map((assignment) => assignment._id.toString()),
        });
        return;
      }
    }

    const result = await Assignment.updateMany(
      { _id: { $in: ids }, ...userScopedFilter(userId) },
      { $set: { status } },
    );

    const updatedAssignments = await findActiveAssignmentsByIds(ids, userId);

    updatedAssignments.forEach((assignment) => {
      emitAssignmentUpdated(userId, buildUpdatedSocketPayload(assignment));
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
