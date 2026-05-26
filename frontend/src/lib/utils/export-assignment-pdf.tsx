"use client";

import { createRoot, type Root } from "react-dom/client";
import { AssignmentPrintRoot } from "@/components/assignment/assignment-print-root";
import { buildAssignmentPdfFilename } from "@/lib/utils/format-assignment";
import type { Assignment } from "@/types/assignment";

const PRINT_MOUNT_ID = "assignment-print-mount";
const PRINT_BODY_CLASS = "is-printing";

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 60);
  });
}

export async function exportAssignmentPdf(
  assignment: Assignment,
  onComplete?: () => void,
): Promise<void> {
  if (typeof window === "undefined") return;

  const existingMount = document.getElementById(PRINT_MOUNT_ID);
  existingMount?.remove();

  const mountNode = document.createElement("div");
  mountNode.id = PRINT_MOUNT_ID;
  mountNode.className = "assignment-print-mount";
  document.body.appendChild(mountNode);

  document.body.classList.add(PRINT_BODY_CLASS);

  const filename = buildAssignmentPdfFilename(assignment.title);
  const previousTitle = document.title;
  document.title = filename.replace(/\.pdf$/i, "");

  let root: Root | null = createRoot(mountNode);

  root.render(<AssignmentPrintRoot assignment={assignment} />);

  await waitForNextFrame();
  await waitForLayout();

  let cleanedUp = false;

  const cleanup = (): void => {
    if (cleanedUp) return;
    cleanedUp = true;

    root?.unmount();
    root = null;
    mountNode.remove();
    document.body.classList.remove(PRINT_BODY_CLASS);
    document.title = previousTitle;
    window.removeEventListener("afterprint", cleanup);
    onComplete?.();
  };

  window.addEventListener("afterprint", cleanup);
  window.print();

  window.setTimeout(() => {
    if (document.body.classList.contains(PRINT_BODY_CLASS)) {
      cleanup();
    }
  }, 2000);
}
