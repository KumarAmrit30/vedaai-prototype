import type { AssignmentDocument } from "./assignment.model";
import { isDeletedAssignment } from "./assignment.queries";
import type { AssignmentStatus } from "./assignment.types";
import { logWarn } from "../../utils/logger";

const FRONTEND_STATUS_MAP: Partial<Record<AssignmentStatus, AssignmentStatus>> =
  {
    processing: "generating",
  };

export function serializeAssignment(assignment: AssignmentDocument) {
  if (isDeletedAssignment(assignment)) {
    logWarn("[ASSIGNMENT] Blocked serialization of deleted assignment", {
      id: assignment._id.toString(),
    });
    throw new Error(
      `Cannot serialize deleted assignment: ${assignment._id.toString()}`,
    );
  }

  const raw = assignment.toObject({ versionKey: false });
  const status = FRONTEND_STATUS_MAP[raw.status] ?? raw.status;
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

  return activeAssignments.map((assignment) => serializeAssignment(assignment));
}
