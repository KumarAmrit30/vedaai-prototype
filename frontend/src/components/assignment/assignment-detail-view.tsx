"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { AssignmentDetailHeader } from "@/components/assignment/assignment-detail-header";
import { AssignmentDetailSidebar } from "@/components/assignment/assignment-detail-sidebar";
import { AssignmentDetailTabs } from "@/components/assignment/assignment-detail-tabs";
import { AssignmentOverviewCards } from "@/components/assignment/assignment-overview-cards";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { exportAssignmentPdf } from "@/lib/utils/export-assignment-pdf";
import { ROUTES } from "@/lib/navigation/routes";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Assignment } from "@/types/assignment";

interface AssignmentDetailViewProps {
  assignment: Assignment;
  onRegenerate?: () => void;
  onDuplicate?: () => void;
}

export function AssignmentDetailView({
  assignment,
  onRegenerate,
  onDuplicate,
}: AssignmentDetailViewProps) {
  const requireAuth = useRequireAuth();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportPdf(): Promise<void> {
    if (isExporting) return;
    if (!requireAuth()) return;

    setIsExporting(true);
    try {
      await exportAssignmentPdf(assignment);
      toast.success("PDF downloaded successfully.");
    } catch {
      toast.error("Unable to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleEdit(): void {
    onRegenerate?.();
  }

  function handleDuplicate(): void {
    if (onDuplicate) {
      onDuplicate();
      return;
    }
    onRegenerate?.();
  }

  return (
    <div className="assignment-detail-view">
      <Link href={ROUTES.assignments} className="assignment-detail-view__back">
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Back to assignments
      </Link>

      <div className="mt-4 space-y-6">
        <AssignmentDetailHeader
          assignment={assignment}
          onDuplicate={handleDuplicate}
          onEdit={onRegenerate ? handleEdit : undefined}
          onExportPdf={
            assignment.generatedPaper?.sections?.length
              ? () => void handleExportPdf()
              : undefined
          }
          isExporting={isExporting}
        />

        <AssignmentOverviewCards assignment={assignment} />

        <div className="assignment-detail-view__layout">
          <div className="assignment-detail-view__preview min-w-0">
            <AssignmentDetailTabs
              assignment={assignment}
              onRegenerate={onRegenerate}
            />
          </div>

          <AssignmentDetailSidebar assignment={assignment} />
        </div>
      </div>
    </div>
  );
}
