"use client";

import { AppShell } from "@/components/layout/app-shell";
import { HomeDashboard } from "@/components/workspace/home-dashboard";
import { useAssignmentsLoader } from "@/hooks/use-assignments-loader";
import { useScrollRestore } from "@/hooks/use-scroll-restore";
import { useShellNavigation } from "@/hooks/use-shell-navigation";
import { useAssignmentStore } from "@/store/assignment.store";

export default function DashboardPage() {
  const { handleNavigate, navigateToCreate } = useShellNavigation();
  const loading = useAssignmentStore((state) => state.loading);
  const { retry, loadError } = useAssignmentsLoader();

  useScrollRestore(".app-shell__workspace", "veda:home-scroll");

  return (
    <AppShell
      title="Dashboard"
      subtitle="Recent activity and quick access"
      activeNav="dashboard"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
    >
      <HomeDashboard
        loading={loading}
        loadError={loadError}
        onRetry={() => void retry()}
      />
    </AppShell>
  );
}
