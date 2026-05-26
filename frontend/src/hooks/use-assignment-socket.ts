"use client";

import { useEffect } from "react";
import { ASSIGNMENT_STATUS } from "@/lib/constants";
import { connectSocket } from "@/lib/socket/client";
import { useAssignmentStore } from "@/store/assignment.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import type {
  AssignmentDeletedPayload,
  AssignmentSocketPayload,
  AssignmentUpdatedPayload,
} from "@/types/assignment-socket";

function pruneSelection(assignmentId: string): void {
  const workspace = useWorkspaceStore.getState();
  if (!workspace.selectedIds.includes(assignmentId)) return;

  workspace.setSelectedIds(
    workspace.selectedIds.filter((id) => id !== assignmentId),
  );
}

export function useAssignmentSocket(): void {
  useEffect(() => {
    const socket = connectSocket();

    function handleProcessing(payload: AssignmentSocketPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        status: ASSIGNMENT_STATUS.GENERATING,
        progress: payload.progress,
      });
    }

    function handleCompleted(payload: AssignmentSocketPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        status: ASSIGNMENT_STATUS.COMPLETED,
        progress: payload.progress,
        ...(payload.generatedPaper
          ? { generatedPaper: payload.generatedPaper }
          : {}),
      });
    }

    function handleFailed(payload: AssignmentSocketPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        status: ASSIGNMENT_STATUS.FAILED,
        progress: payload.progress,
      });
    }

    function handleUpdated(payload: AssignmentUpdatedPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
        ...(payload.generatedPaper
          ? { generatedPaper: payload.generatedPaper }
          : {}),
      });
    }

    function handleDeleted(payload: AssignmentDeletedPayload): void {
      if (!payload?.assignmentId) return;

      const store = useAssignmentStore.getState();
      const exists = store.assignments.some(
        (item) => item._id === payload.assignmentId,
      );

      if (!exists) return;

      store.removeAssignmentsById([payload.assignmentId]);
      pruneSelection(payload.assignmentId);
    }

    socket.on("assignment:processing", handleProcessing);
    socket.on("assignment:completed", handleCompleted);
    socket.on("assignment:failed", handleFailed);
    socket.on("assignment:updated", handleUpdated);
    socket.on("assignment:deleted", handleDeleted);

    return () => {
      socket.off("assignment:processing", handleProcessing);
      socket.off("assignment:completed", handleCompleted);
      socket.off("assignment:failed", handleFailed);
      socket.off("assignment:updated", handleUpdated);
      socket.off("assignment:deleted", handleDeleted);
    };
  }, []);
}
