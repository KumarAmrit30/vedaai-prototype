"use client";

import { useMemo, useState } from "react";
import {
  AssignmentCreateFlow,
  type CreateAssignmentForm,
} from "@/components/assignment/assignment-create-flow";
import { AppShell } from "@/components/layout/app-shell";
import { PageTransition } from "@/components/layout/page-transition";
import { useAssignmentsLoader } from "@/hooks/use-assignments-loader";
import { useShellNavigation } from "@/hooks/use-shell-navigation";
import { consumeDuplicateForm } from "@/lib/utils/duplicate-assignment";
import { useAssignmentStore } from "@/store/assignment.store";

export default function CreateAssignmentPage() {
  const { handleNavigate, navigateHome, navigateToCreate, comingSoon } =
    useShellNavigation();

  const assignments = useAssignmentStore((state) => state.assignments);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);

  useAssignmentsLoader();

  const [duplicateForm] = useState<CreateAssignmentForm | null>(() => {
    if (typeof window === "undefined") return null;
    return consumeDuplicateForm();
  });

  const flowKey = useMemo(
    () => duplicateForm?.title ?? "create-default",
    [duplicateForm],
  );

  return (
    <AppShell
      title="Create Assignment"
      subtitle="Build an AI-generated assessment"
      activeNav="generate"
      onNavigate={handleNavigate}
      onCreateClick={navigateToCreate}
      comingSoon={comingSoon}
    >
      <PageTransition>
        <AssignmentCreateFlow
          key={flowKey}
          assignments={assignments}
          setAssignments={setAssignments}
          onComplete={navigateHome}
          initialForm={duplicateForm}
        />
      </PageTransition>
    </AppShell>
  );
}
