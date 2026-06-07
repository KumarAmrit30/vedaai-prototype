"use client";

import type { Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { normalizeAssignmentStatus } from "@/lib/utils/assignment-status";
import { connectSocket, disconnectSocket } from "@/lib/socket/client";
import { useAssignmentStore } from "@/store/assignment.store";
import { useAuthStore } from "@/store/auth.store";
import { useUserStore } from "@/store/user.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import type {
  AssignmentDeletedPayload,
  AssignmentSocketPayload,
  AssignmentUpdatedPayload,
} from "@/types/assignment-socket";

const SOCKET_DISCONNECT_TOAST_ID = "socket-disconnect";

function pruneSelection(assignmentId: string): void {
  const workspace = useWorkspaceStore.getState();
  if (!workspace.selectedIds.includes(assignmentId)) return;

  workspace.setSelectedIds(
    workspace.selectedIds.filter((id) => id !== assignmentId),
  );
}

export function useAssignmentSocket(): void {
  const authStatus = useAuthStore((state) => state.status);
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    if (authStatus === "loading") return;

    if (authStatus === "unauthenticated") {
      disconnectSocket();
      wasConnectedRef.current = false;
      return;
    }

    let cancelled = false;
    let socket: Socket | null = null;

    function handleProcessing(payload: AssignmentSocketPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        status: normalizeAssignmentStatus(payload.status),
        progress: payload.progress,
      });
    }

    function handleCompleted(payload: AssignmentSocketPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        status: normalizeAssignmentStatus(payload.status),
        progress: payload.progress,
        ...(payload.generatedPaper
          ? { generatedPaper: payload.generatedPaper }
          : {}),
      });

      void useUserStore.getState().fetchProfile();
    }

    function handleFailed(payload: AssignmentSocketPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        status: normalizeAssignmentStatus(payload.status),
        progress: payload.progress,
      });
    }

    function handleUpdated(payload: AssignmentUpdatedPayload): void {
      if (!payload?.assignmentId) return;

      useAssignmentStore.getState().updateAssignment(payload.assignmentId, {
        ...(payload.status
          ? { status: normalizeAssignmentStatus(payload.status) }
          : {}),
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

    function handleConnect(): void {
      if (wasConnectedRef.current) {
        toast.dismiss(SOCKET_DISCONNECT_TOAST_ID);
        toast.success("Realtime connection restored.", {
          id: "socket-reconnected",
          duration: 2500,
        });
      }

      wasConnectedRef.current = true;
    }

    function handleDisconnect(reason: string): void {
      if (!wasConnectedRef.current || reason === "io client disconnect") return;

      toast("Connection lost. Reconnecting…", {
        id: SOCKET_DISCONNECT_TOAST_ID,
        duration: Infinity,
        className: "app-toast app-toast--info",
        icon: "◷",
      });
    }

    void (async () => {
      const token = await useAuthStore.getState().getIdToken();
      if (cancelled || !token) return;

      socket = connectSocket(token);

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("assignment:processing", handleProcessing);
      socket.on("assignment:completed", handleCompleted);
      socket.on("assignment:failed", handleFailed);
      socket.on("assignment:updated", handleUpdated);
      socket.on("assignment:deleted", handleDeleted);
    })();

    return () => {
      cancelled = true;

      if (!socket) return;

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("assignment:processing", handleProcessing);
      socket.off("assignment:completed", handleCompleted);
      socket.off("assignment:failed", handleFailed);
      socket.off("assignment:updated", handleUpdated);
      socket.off("assignment:deleted", handleDeleted);
    };
  }, [authStatus]);
}
