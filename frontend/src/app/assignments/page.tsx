"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AssignmentWorkspace } from "@/components/workspace/assignment-workspace";
import { useAssignmentsLoader } from "@/hooks/use-assignments-loader";
import { useShellNavigation } from "@/hooks/use-shell-navigation";

export default function AssignmentsWorkspacePage() {
  const { handleNavigate, navigateToCreate, comingSoon } = useShellNavigation();
  const { retry, loadError } = useAssignmentsLoader();

  return (
    <AppShell
      title="Assignments"
      subtitle="Search, filter, and manage your assessments"
      activeNav="assignments"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <AssignmentWorkspace
        fetchError={loadError}
        onRetry={() => void retry()}
      />
    </AppShell>
  );
}
