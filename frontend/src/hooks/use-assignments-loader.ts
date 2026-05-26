"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
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
  loadError: string | null;
} {
  const loadedOnce = useAssignmentStore((state) => state.loadedOnce);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const setLoadedOnce = useAssignmentStore((state) => state.setLoadedOnce);
  const loading = useAssignmentStore((state) => state.loading);
  const setLoading = useAssignmentStore((state) => state.setLoading);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAssignments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await apiClient.get<AssignmentsResponse>("/assignments");
      const payload = response.data;
      const data = Array.isArray(payload?.data) ? payload.data : [];

      setAssignments(data);
    } catch (error) {
      let message = "We couldn’t load your assignments. Please try again.";

      if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data as
          | { message?: string }
          | undefined;
        message = responseMessage?.message ?? message;
      }

      setLoadError(message);
      setLoadedOnce(true);
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setAssignments, setLoadedOnce, setLoading]);

  useEffect(() => {
    if (!enabled || loadedOnce || loading) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap fetch on first mount
    void loadAssignments().catch(() => undefined);
  }, [enabled, loadedOnce, loadAssignments, loading]);

  return { retry: loadAssignments, loadError };
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
