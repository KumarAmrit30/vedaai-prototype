"use client";

import { Download, Loader2, Pencil, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AssignmentPaper } from "@/components/assignment/assignment-paper";
import {
  AssignmentPreviewError,
  type PreviewErrorKind,
} from "@/components/assignment/assignment-preview-error";
import { ASSIGNMENT_STATUS } from "@/lib/constants";
import { exportAssignmentPdf } from "@/lib/utils/export-assignment-pdf";
import type { Assignment } from "@/types/assignment";

interface AssignmentPreviewProps {
  assignment: Assignment;
  onEdit?: () => void;
  onDone?: () => void;
  onRegenerate?: () => void;
  showDone?: boolean;
  previewError?: PreviewErrorKind | null;
  onRetry?: () => void;
  onBackFromError?: () => void;
}

export function AssignmentPreview({
  assignment,
  onEdit,
  onDone,
  onRegenerate,
  showDone = true,
  previewError = null,
  onRetry,
  onBackFromError,
}: AssignmentPreviewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [toolbarElevated, setToolbarElevated] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const workspace = stage.closest(".app-shell__workspace");
    const scrollTarget = workspace ?? window;

    function handleScroll(): void {
      const scrollTop =
        scrollTarget instanceof Window
          ? window.scrollY
          : (scrollTarget as HTMLElement).scrollTop;
      setToolbarElevated(scrollTop > 8);
    }

    handleScroll();
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleDownloadPdf(): Promise<void> {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);

    try {
      await exportAssignmentPdf(assignment);
      toast.success("PDF downloaded successfully.");
    } catch (error) {
      console.error("PDF ERROR:", error);
      toast.error("Unable to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleRegenerate(): void {
    if (onRegenerate) {
      onRegenerate();
      return;
    }

    toast("Regenerate is available from the create flow.", { icon: "✨" });
  }

  const resolvedError =
    previewError ??
    (assignment.status === ASSIGNMENT_STATUS.FAILED
      ? ("failed" as const)
      : assignment.status === ASSIGNMENT_STATUS.COMPLETED &&
          !assignment.generatedPaper?.sections?.length
        ? ("invalid" as const)
        : null);

  if (resolvedError) {
    return (
      <AssignmentPreviewError
        kind={resolvedError}
        onRetry={onRetry ?? onRegenerate}
        onBack={onBackFromError ?? onEdit}
      />
    );
  }

  const toolbarClassName = [
    "preview-action-bar",
    "hidden md:flex",
    toolbarElevated ? "preview-action-bar--elevated" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mobileToolbarClassName = [
    "preview-action-bar preview-action-bar--mobile md:hidden",
    toolbarElevated ? "preview-action-bar--elevated" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const downloadLabel = isGeneratingPdf ? "Generating PDF..." : "Download PDF";
  const mobileDownloadLabel = isGeneratingPdf ? "Generating..." : "Download";

  return (
    <div
      ref={stageRef}
      className="preview-document-stage preview-document-stage--enter"
    >
      <div className={toolbarClassName}>
        <button
          type="button"
          onClick={() => void handleDownloadPdf()}
          disabled={isGeneratingPdf}
          className="preview-action-btn"
          aria-busy={isGeneratingPdf}
          aria-label={downloadLabel}
        >
          {isGeneratingPdf ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          {downloadLabel}
        </button>
        <button type="button" onClick={handleRegenerate} className="preview-action-btn">
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          Regenerate
        </button>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="preview-action-btn">
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
            Edit
          </button>
        ) : null}
        {showDone && onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="preview-action-btn preview-action-btn--primary"
          >
            Done
          </button>
        ) : null}
      </div>

      <div className="preview-document-canvas">
        <AssignmentPaper assignment={assignment} />
      </div>

      <div className={mobileToolbarClassName}>
        <button
          type="button"
          onClick={() => void handleDownloadPdf()}
          disabled={isGeneratingPdf}
          className="preview-action-btn"
          aria-busy={isGeneratingPdf}
          aria-label={downloadLabel}
        >
          {isGeneratingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Download className="h-4 w-4" strokeWidth={2} />
          )}
          {mobileDownloadLabel}
        </button>
        {onRegenerate ? (
          <button type="button" onClick={handleRegenerate} className="preview-action-btn">
            <RefreshCw className="h-4 w-4" strokeWidth={2} />
            Regenerate
          </button>
        ) : null}
        {showDone && onDone ? (
          <button
            type="button"
            onClick={onDone}
            className="preview-action-btn preview-action-btn--primary"
          >
            Done
          </button>
        ) : null}
      </div>
    </div>
  );
}
