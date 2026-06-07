"use client";

import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AssignmentDetailView } from "@/components/assignment/assignment-detail-view";
import { AssignmentLoading } from "@/components/assignment/assignment-loading";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/layout/page-transition";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useShellNavigation } from "@/hooks/use-shell-navigation";
import apiClient from "@/lib/api/axios";
import { ROUTES } from "@/lib/navigation/routes";
import { getApiErrorMessage } from "@/lib/utils/get-api-error-message";
import { storeDuplicateAssignment } from "@/lib/utils/duplicate-assignment";
import { markAssignmentOpened } from "@/lib/workspace/assignment-meta";
import { useAssignmentStore } from "@/store/assignment.store";
import { useAuthStore } from "@/store/auth.store";
import { useWorkspaceStore } from "@/store/workspace.store";
import type { Assignment } from "@/types/assignment";

interface AssignmentByIdResponse {
  success: boolean;
  data: Assignment;
  message?: string;
}

export default function AssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const removeAssignmentsById = useAssignmentStore(
    (state) => state.removeAssignmentsById,
  );
  const authStatus = useAuthStore((state) => state.status);
  const requireAuth = useRequireAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      requireAuth();
    }
  }, [authStatus, requireAuth]);

  useEffect(() => {
    if (!params.id) return;
    if (authStatus !== "authenticated") return;

    let cancelled = false;

    async function fetchAssignment(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<AssignmentByIdResponse>(
          `/assignments/${params.id}`,
        );

        if (cancelled) return;

        const fetched = response.data.data;
        setAssignment(fetched);
        markAssignmentOpened(fetched._id);
        useWorkspaceStore.getState().setRecentlyOpenedHighlightId(fetched._id);

        const currentAssignments = useAssignmentStore.getState().assignments;
        const exists = currentAssignments.some((item) => item._id === fetched._id);

        if (!exists) {
          setAssignments([fetched, ...currentAssignments]);
        } else {
          setAssignments(
            currentAssignments.map((item) =>
              item._id === fetched._id ? fetched : item,
            ),
          );
        }
      } catch (fetchError) {
        if (cancelled) return;

        const isNotFound =
          axios.isAxiosError(fetchError) && fetchError.response?.status === 404;

        let message = getApiErrorMessage(
          fetchError,
          "Unable to load this assignment. Please try again.",
        );

        if (isNotFound) {
          message = "This assignment could not be found. It may have been deleted.";
          removeAssignmentsById([params.id]);
        }

        setError(message);
        if (!isNotFound) {
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAssignment();

    return () => {
      cancelled = true;
    };
  }, [authStatus, params.id, removeAssignmentsById, setAssignments]);

  function handleRetry(): void {
    if (!params.id) return;
    setLoading(true);
    setError(null);

    void apiClient
      .get<AssignmentByIdResponse>(`/assignments/${params.id}`)
      .then((response) => {
        setAssignment(response.data.data);
      })
      .catch((retryError) => {
        const message = getApiErrorMessage(
          retryError,
          "Unable to reload assignment. Please try again.",
        );
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }

  function handleRegenerate(): void {
    if (!assignment) return;

    storeDuplicateAssignment(assignment);
    toast.success("Opening create flow to regenerate this assignment.");
    router.push(ROUTES.createAssignment);
  }

  return (
    <AppShell
      title="Assignment"
      subtitle={assignment?.title ?? "View assessment details"}
      activeNav="assignments"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      {loading ? (
        <AssignmentLoading
          title="Loading assignment..."
          message="Fetching assessment details and generated paper."
        />
      ) : null}

      {!loading && error ? (
        <div className="product-state-card surface-card-compact mx-auto max-w-xl px-6 py-8 text-center">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
            {error.includes("deleted") ? "Assignment not found" : "Unable to open assignment"}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {error}
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(ROUTES.assignments)}
              className="outline-pill-btn"
            >
              Back to assignments
            </button>
            <button type="button" onClick={handleRetry} className="submit-pill-btn">
              Try again
            </button>
          </div>
        </div>
      ) : null}

      {!loading && !error && assignment ? (
        <PageTransition>
          <AssignmentDetailView
            assignment={assignment}
            onRegenerate={handleRegenerate}
          />
        </PageTransition>
      ) : null}
    </AppShell>
  );
}
