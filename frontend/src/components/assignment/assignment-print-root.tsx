"use client";

import type { Assignment } from "@/types/assignment";
import { AssignmentPaper } from "@/components/assignment/assignment-paper";

interface AssignmentPrintRootProps {
  assignment: Assignment;
}

export function AssignmentPrintRoot({ assignment }: AssignmentPrintRootProps) {
  return (
    <div className="assignment-print-root">
      <AssignmentPaper assignment={assignment} variant="print" />
    </div>
  );
}
