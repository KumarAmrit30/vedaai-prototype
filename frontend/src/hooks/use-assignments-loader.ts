"use client";

import axios from "axios";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/api/axios";
import { deriveWorkspaceStatus } from "@/lib/utils/assignment-status";
import { useAssignmentStore } from "@/store/assignment.store";
import type { Assignment } from "@/types/assignment";

interface AssignmentsResponse {
  success: boolean;
  data: Assignment[];
}

export function useAssignmentsLoader(enabled = true): {
  retry: () => Promise<void>;
} {
  const loadedOnce = useAssignmentStore((state) => state.loadedOnce);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const loading = useAssignmentStore((state) => state.loading);
  const setLoading = useAssignmentStore((state) => state.setLoading);

  const loadAssignments = useCallback(async (): Promise<void> => {
    console.log("[LOADER] Fetch started");
    setLoading(true);

    try {
      const response = await apiClient.get<AssignmentsResponse>("/assignments");
      const data = Array.isArray(response.data.data) ? response.data.data : [];

      setAssignments(data);
      console.log("[LOADER] Fetch resolved", { count: data.length });
    } catch (error) {
      let message = "We couldn’t load your assignments. Please try again.";

      if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data as
          | { message?: string }
          | undefined;
        message = responseMessage?.message ?? message;
      }

      console.error("[LOADER] Fetch failed", error);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
      console.log("[LOADER] Loading flag cleared");
    }
  }, [setAssignments, setLoading]);

  useEffect(() => {
    if (!enabled || loadedOnce || loading) return;

    void loadAssignments().catch(() => undefined);
  }, [enabled, loadedOnce, loadAssignments, loading]);

  return { retry: loadAssignments };
}

export function useDashboardStats(assignments: Assignment[]): {
  total: number;
  pending: number;
  completed: number;
} {
  const safeAssignments = Array.isArray(assignments) ? assignments : [];
  const total = safeAssignments.length;
  const completed = safeAssignments.filter(
    (item) => deriveWorkspaceStatus(item) === "completed",
  ).length;
  const pending = total - completed;

  return { total, pending, completed };
}
