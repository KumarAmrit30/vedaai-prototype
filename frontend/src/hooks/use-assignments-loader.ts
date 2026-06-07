"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/api/axios";
import { getApiErrorMessage } from "@/lib/utils/get-api-error-message";
import { deriveWorkspaceStatus } from "@/lib/utils/assignment-status";
import { useAssignmentStore } from "@/store/assignment.store";
import { useAuthStore } from "@/store/auth.store";
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
  const authStatus = useAuthStore((state) => state.status);
  const authReady = authStatus === "authenticated";

  const loadAssignments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await apiClient.get<AssignmentsResponse>("/assignments");
      const payload = response.data;
      const data = Array.isArray(payload?.data) ? payload.data : [];

      setAssignments(data);
    } catch (error) {
      const isUnauthorized =
        axios.isAxiosError(error) && error.response?.status === 401;

      const message = getApiErrorMessage(
        error,
        "Unable to load assignments. Please try again.",
      );

      setLoadError(message);

      if (!isUnauthorized) {
        setLoadedOnce(true);
      }

      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setAssignments, setLoadedOnce, setLoading]);

  useEffect(() => {
    if (!enabled || !authReady || loadedOnce || loading) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap fetch after auth ready
    void loadAssignments().catch(() => undefined);
  }, [authReady, enabled, loadedOnce, loadAssignments, loading]);

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
