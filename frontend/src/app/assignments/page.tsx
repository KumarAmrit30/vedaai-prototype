"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AppShell } from "@/components/layout/app-shell";
import { AssignmentWorkspace } from "@/components/workspace/assignment-workspace";
import { useAssignmentsLoader } from "@/hooks/use-assignments-loader";
import { useShellNavigation } from "@/hooks/use-shell-navigation";
import { useAssignmentStore } from "@/store/assignment.store";

export default function AssignmentsWorkspacePage() {
  const { handleNavigate, navigateToCreate } = useShellNavigation();
  const setLoading = useAssignmentStore((state) => state.setLoading);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { retry } = useAssignmentsLoader();

  async function retryFetchAssignments(): Promise<void> {
    setFetchError(null);
    setLoading(true);

    try {
      await retry();
    } catch (error) {
      let message = "We couldn’t load your assignments. Please try again.";

      if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data as
          | { message?: string }
          | undefined;
        message = responseMessage?.message ?? message;
      }

      setFetchError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="Assignments"
      subtitle="Search, filter, and manage your assessments"
      activeNav="assignments"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
    >
      <AssignmentWorkspace
        fetchError={fetchError}
        onRetry={() => void retryFetchAssignments()}
      />
    </AppShell>
  );
}
