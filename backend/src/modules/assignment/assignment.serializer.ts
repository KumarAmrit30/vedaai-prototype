import type { AssignmentDocument } from "./assignment.model";
import { isDeletedAssignment } from "./assignment.queries";
import { normalizeAssignmentStatus } from "./assignment.status";
import { logWarn } from "../../utils/logger";

function serializeAssignmentCore(assignment: AssignmentDocument) {
  if (isDeletedAssignment(assignment)) {
    logWarn("[ASSIGNMENT] Blocked serialization of deleted assignment", {
      id: assignment._id.toString(),
    });
    throw new Error(
      `Cannot serialize deleted assignment: ${assignment._id.toString()}`,
    );
  }

  const raw = assignment.toObject({ versionKey: false });
  const status = normalizeAssignmentStatus(raw.status);
  const {
    materialText: _materialText,
    isDeleted: _isDeleted,
    deletedAt: _deletedAt,
    ...rest
  } = raw;

  const materialSource =
    raw.materialSource ??
    (raw.originalFileName && raw.materialSourceType
      ? {
          fileName: raw.originalFileName,
          fileType: raw.materialSourceType,
          fileSize: 0,
          charCount: raw.materialText?.length ?? 0,
        }
      : undefined);

  const { materialSourceType: _materialSourceType, originalFileName: _originalFileName, materialSource: _nestedMaterialSource, ...publicRest } = rest;

  return {
    ...publicRest,
    _id: assignment._id.toString(),
    status,
    ...(materialSource ? { materialSource } : {}),
  };
}

/** Full assignment payload for detail and mutation responses. */
export function serializeAssignment(assignment: AssignmentDocument) {
  return serializeAssignmentCore(assignment);
}

/** List payload — omits answerKey to reduce response size. */
export function serializeAssignmentForList(assignment: AssignmentDocument) {
  const serialized = serializeAssignmentCore(assignment);
  const { answerKey: _answerKey, ...withoutAnswerKey } = serialized;
  return withoutAnswerKey;
}

export function serializeAssignments(assignments: AssignmentDocument[]) {
  const activeAssignments = assignments.filter(
    (assignment) => !isDeletedAssignment(assignment),
  );
  const filteredCount = assignments.length - activeAssignments.length;

  if (filteredCount > 0) {
    logWarn("[ASSIGNMENT] Serializer excluded deleted assignments", {
      filteredCount,
    });
  }

  return activeAssignments.map((assignment) =>
    serializeAssignmentForList(assignment),
  );
}
