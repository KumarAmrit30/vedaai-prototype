"use client";

import { isAxiosError } from "axios";
import { ChevronDown, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AssignmentLoading } from "@/components/assignment/assignment-loading";
import { AssignmentPreview } from "@/components/assignment/assignment-preview";
import type { PreviewErrorKind } from "@/components/assignment/assignment-preview-error";
import {
  AssignmentStepper,
  type FlowStepId,
} from "@/components/assignment/assignment-stepper";
import {
  AssignmentUpload,
  type UploadedMaterial,
  validateMaterialFile,
} from "@/components/assignment/assignment-upload";
import apiClient from "@/lib/api/axios";
import { ASSIGNMENT_STATUS } from "@/lib/constants";
import { getApiErrorMessage } from "@/lib/utils/get-api-error-message";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  selectClassName,
  surfaceFormClassName,
  textareaClassName,
} from "@/lib/utils/form-styles";
import {
  clearCreateDraft,
  hasMeaningfulDraft,
  loadCreateDraft,
  saveCreateDraft,
  type CreateAssignmentDraft,
} from "@/lib/workspace/create-draft";
import { DraftResumePrompt } from "@/components/workspace/draft-resume-prompt";
import { useAssignmentStore } from "@/store/assignment.store";
import { useUserStore } from "@/store/user.store";
import type { Assignment } from "@/types/assignment";

export interface CreateAssignmentForm {
  title: string;
  topic: string;
  dueDate: string;
  instructions: string;
  questionType: string;
  numberOfQuestions: string;
  marksPerQuestion: string;
}

interface CreateAssignmentResponse {
  success: boolean;
  message: string;
  data: Assignment;
}

export const initialFormState: CreateAssignmentForm = {
  title: "",
  topic: "",
  dueDate: "",
  instructions: "",
  questionType: "",
  numberOfQuestions: "",
  marksPerQuestion: "",
};

const questionTypeOptions = [
  { value: "short-answer", label: "Short Answer" },
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "long-answer", label: "Long Answer" },
  { value: "true-false", label: "True / False" },
];

const GENERATION_TIMEOUT_MS = 5 * 60 * 1000;
const GENERATION_QUEUED_TOAST = "Assignment queued for generation";
const GENERATION_SUCCESS_TOAST = "Assignment generated successfully";
const GENERATION_FAILURE_TOAST =
  "Unable to generate assignment. Please try again or adjust your inputs.";

interface AssignmentCreateFlowProps {
  assignments: Assignment[];
  setAssignments: (assignments: Assignment[]) => void;
  onComplete?: () => void;
  initialForm?: CreateAssignmentForm | null;
}

function validateDetailsForm(form: CreateAssignmentForm): boolean {
  return Boolean(
    form.title.trim() &&
      form.topic.trim() &&
      form.dueDate &&
      form.instructions.trim() &&
      form.questionType &&
      form.numberOfQuestions &&
      form.marksPerQuestion,
  );
}

export function AssignmentCreateFlow({
  assignments,
  setAssignments,
  onComplete,
  initialForm = null,
}: AssignmentCreateFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStepId>("details");
  const [stepDirection, setStepDirection] = useState<"forward" | "back">("forward");
  const [form, setForm] = useState<CreateAssignmentForm>(
    () => initialForm ?? initialFormState,
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedMaterial[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewError, setPreviewError] = useState<PreviewErrorKind | null>(null);
  const [createdAssignment, setCreatedAssignment] = useState<Assignment | null>(
    null,
  );
  const generatingAssignmentIdRef = useRef<string | null>(null);
  const generationStartedAtRef = useRef<number | null>(null);
  const generationOutcomeNotifiedRef = useRef<string | null>(null);
  const generationTerminalHandledRef = useRef<string | null>(null);
  const storeAssignments = useAssignmentStore((state) => state.assignments);
  const [pendingDraft] = useState<CreateAssignmentDraft | null>(() => {
    if (initialForm) return null;
    if (typeof window === "undefined") return null;
    const draft = loadCreateDraft();
    return hasMeaningfulDraft(draft) ? draft : null;
  });
  const [draftResolved, setDraftResolved] = useState(() => !pendingDraft);

  useEffect(() => {
    if (!draftResolved || initialForm) return;

    const timer = window.setTimeout(() => {
      saveCreateDraft({
        form,
        uploadedFiles,
        currentStep,
      });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [currentStep, draftResolved, form, initialForm, uploadedFiles]);

  const handleChange = useCallback(
    (field: keyof CreateAssignmentForm, value: string): void => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleFilesAdd = useCallback((files: UploadedMaterial[]): void => {
    setUploadedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileRemove = useCallback((id: string): void => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const resetFlow = useCallback((): void => {
    setForm(initialFormState);
    setUploadedFiles([]);
    setCreatedAssignment(null);
    setPreviewError(null);
    generatingAssignmentIdRef.current = null;
    generationStartedAtRef.current = null;
    generationOutcomeNotifiedRef.current = null;
    generationTerminalHandledRef.current = null;
    setIsGenerating(false);
    setIsSubmitting(false);
    setCurrentStep("details");
    clearCreateDraft();
  }, []);

  async function handleGenerate(): Promise<void> {
    if (!validateDetailsForm(form)) {
      toast.error("Please complete all assignment details first.");
      setCurrentStep("details");
      return;
    }

    const readyMaterials = uploadedFiles.filter(
      (material) => material.status === "ready" && material.file,
    );
    const invalidMaterials = uploadedFiles.filter(
      (material) => material.status === "error",
    );

    if (invalidMaterials.length > 0) {
      toast.error("Remove invalid files before generating.");
      setCurrentStep("upload");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("topic", form.topic);
      formData.append("dueDate", form.dueDate);
      formData.append("instructions", form.instructions);
      formData.append(
        "questionConfig",
        JSON.stringify({
          questionType: form.questionType,
          numberOfQuestions: Number(form.numberOfQuestions),
          marksPerQuestion: Number(form.marksPerQuestion),
        }),
      );

      for (const material of readyMaterials) {
        const validationError = validateMaterialFile(material.file);
        if (validationError) {
          toast.error(validationError);
          setCurrentStep("upload");
          return;
        }

        formData.append("materials", material.file, material.name);
      }

      const response = await apiClient.post<CreateAssignmentResponse>(
        "/assignments",
        formData,
        {
          timeout: 60000,
        },
      );

      const created = response.data.data;
      setCreatedAssignment(created);
      generatingAssignmentIdRef.current = created._id;
      generationStartedAtRef.current = Date.now();
      generationOutcomeNotifiedRef.current = null;
      generationTerminalHandledRef.current = null;
      setPreviewError(null);
      setAssignments([created, ...assignments]);
      setStepDirection("forward");
      setIsGenerating(true);
      void useUserStore.getState().fetchProfile();
      toast(GENERATION_QUEUED_TOAST, {
        id: `assignment-queued-${created._id}`,
        className: "app-toast app-toast--info",
        icon: "◷",
      });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        useUserStore.getState().openUpgradeModal();
        return;
      }

      toast.error(
        getApiErrorMessage(error, "Unable to create assignment. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!isGenerating || !generatingAssignmentIdRef.current) return;

    const assignmentId = generatingAssignmentIdRef.current;
    const updated = storeAssignments.find((item) => item._id === assignmentId);
    if (!updated) return;

    setCreatedAssignment(updated);

    if (generationTerminalHandledRef.current === updated._id) return;

    if (updated.status === ASSIGNMENT_STATUS.COMPLETED) {
      generationTerminalHandledRef.current = updated._id;

      if (!updated.generatedPaper?.sections?.length) {
        setPreviewError("invalid");
      } else {
        setPreviewError(null);
        clearCreateDraft();
        if (generationOutcomeNotifiedRef.current !== updated._id) {
          generationOutcomeNotifiedRef.current = updated._id;
          toast.success(GENERATION_SUCCESS_TOAST, {
            id: `assignment-generated-${updated._id}`,
          });
        }
      }

      setStepDirection("forward");
      setCurrentStep("preview");
      setIsGenerating(false);
      generatingAssignmentIdRef.current = null;
      generationStartedAtRef.current = null;
      return;
    }

    if (updated.status === ASSIGNMENT_STATUS.FAILED) {
      generationTerminalHandledRef.current = updated._id;
      setPreviewError("failed");
      setStepDirection("forward");
      setCurrentStep("preview");
      setIsGenerating(false);
      generatingAssignmentIdRef.current = null;
      generationStartedAtRef.current = null;

      if (generationOutcomeNotifiedRef.current !== updated._id) {
        generationOutcomeNotifiedRef.current = updated._id;
        toast.error(GENERATION_FAILURE_TOAST, {
          id: `assignment-failed-${updated._id}`,
        });
      }
    }
  }, [isGenerating, storeAssignments]);

  useEffect(() => {
    if (!isGenerating || !generationStartedAtRef.current) return;

    const timeoutId = window.setTimeout(() => {
      if (!generatingAssignmentIdRef.current) return;

      setPreviewError("timeout");
      setStepDirection("forward");
      setCurrentStep("preview");
      setIsGenerating(false);
      generatingAssignmentIdRef.current = null;
      generationStartedAtRef.current = null;
      toast.error("Generation is taking longer than expected.");
    }, GENERATION_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isGenerating]);

  function goToNextStep(): void {
    if (currentStep === "details") {
      if (!validateDetailsForm(form)) {
        toast.error("Please fill in all required fields.");
        return;
      }
      setStepDirection("forward");
      setCurrentStep("upload");
      return;
    }

    if (currentStep === "upload") {
      setStepDirection("forward");
      setCurrentStep("generate");
    }
  }

  function goToPreviousStep(): void {
    if (currentStep === "upload") {
      setStepDirection("back");
      setCurrentStep("details");
      return;
    }

    if (currentStep === "generate" && !isGenerating) {
      setStepDirection("back");
      setCurrentStep("upload");
    }
  }

  function handleFinish(): void {
    resetFlow();
    onComplete?.();
  }

  async function handleRegenerate(): Promise<void> {
    setPreviewError(null);
    setCreatedAssignment(null);
    generatingAssignmentIdRef.current = null;
    generationStartedAtRef.current = null;
    generationOutcomeNotifiedRef.current = null;
    generationTerminalHandledRef.current = null;
    setStepDirection("forward");
    setCurrentStep("generate");
    await handleGenerate();
  }

  function handleRetryFromError(): void {
    setPreviewError(null);
    void handleRegenerate();
  }

  const previewAssignment = createdAssignment ?? null;
  const stepPanelKey =
    currentStep === "generate" && isGenerating ? "generate-loading" : currentStep;

  return (
    <section
      id="create-assignment"
      className={`mx-auto space-y-4 ${
        currentStep === "preview" ? "w-full max-w-none" : "max-w-2xl"
      }`}
    >
      {pendingDraft && !draftResolved ? (
        <DraftResumePrompt
          draft={pendingDraft}
          onResume={() => {
            setForm(pendingDraft.form);
            setUploadedFiles(pendingDraft.uploadedFiles);
            setCurrentStep(pendingDraft.currentStep);
            setDraftResolved(true);
          }}
          onDiscard={() => {
            clearCreateDraft();
            setDraftResolved(true);
          }}
        />
      ) : null}

      {draftResolved ? (
        <>
      <div className="surface-card-compact px-3.5 py-3 sm:px-4">
        <AssignmentStepper currentStep={currentStep} />
      </div>

      {currentStep === "details" ? (
        <div
          key="details"
          className={`flow-step-panel flow-step-panel--${stepDirection}`}
        >
          <div className={surfaceFormClassName}>
          <div className="mb-3">
            <h2 className="section-title">Assignment Details</h2>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
              Set up the basics for your AI-generated assessment.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              goToNextStep();
            }}
            className="space-y-3"
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className={labelClassName}>
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={inputClassName}
                  placeholder="DBMS Midterm Assessment"
                />
              </div>
              <div>
                <label htmlFor="topic" className={labelClassName}>
                  Topic
                </label>
                <input
                  id="topic"
                  type="text"
                  required
                  value={form.topic}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  className={inputClassName}
                  placeholder="DBMS"
                />
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor="dueDate" className={labelClassName}>
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label htmlFor="questionType" className={labelClassName}>
                  Question Type
                </label>
                <div className="relative">
                  <select
                    id="questionType"
                    required
                    value={form.questionType}
                    onChange={(e) =>
                      handleChange("questionType", e.target.value)
                    }
                    className={selectClassName}
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    {questionTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)] opacity-60" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="instructions" className={labelClassName}>
                Instructions
              </label>
              <textarea
                id="instructions"
                required
                rows={2}
                value={form.instructions}
                onChange={(e) => handleChange("instructions", e.target.value)}
                className={textareaClassName}
                placeholder="Answer all questions clearly."
              />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor="numberOfQuestions" className={labelClassName}>
                  Questions
                </label>
                <input
                  id="numberOfQuestions"
                  type="number"
                  min={1}
                  required
                  value={form.numberOfQuestions}
                  onChange={(e) =>
                    handleChange("numberOfQuestions", e.target.value)
                  }
                  className={inputClassName}
                  placeholder="6"
                />
              </div>
              <div>
                <label htmlFor="marksPerQuestion" className={labelClassName}>
                  Marks Each
                </label>
                <input
                  id="marksPerQuestion"
                  type="number"
                  min={1}
                  required
                  value={form.marksPerQuestion}
                  onChange={(e) =>
                    handleChange("marksPerQuestion", e.target.value)
                  }
                  className={inputClassName}
                  placeholder="5"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" className={primaryButtonClassName}>
                Continue
              </button>
            </div>
          </form>
          </div>
        </div>
      ) : null}

      {currentStep === "upload" ? (
        <div
          key="upload"
          className={`flow-step-panel flow-step-panel--${stepDirection}`}
        >
          <div className={surfaceFormClassName}>
          <div className="mb-3">
            <h2 className="section-title">Upload Materials</h2>
        <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
          PDF or TXT — optional reference files for generation
        </p>
          </div>

          <AssignmentUpload
            files={uploadedFiles}
            onFilesAdd={handleFilesAdd}
            onFileRemove={handleFileRemove}
          />

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="outline-pill-btn w-full sm:w-auto"
            >
              Back
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setStepDirection("forward");
                  setCurrentStep("generate");
                }}
                className="outline-pill-btn w-full sm:w-auto"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className={`${primaryButtonClassName} w-full sm:w-auto`}
              >
                Continue
              </button>
            </div>
          </div>
          </div>
        </div>
      ) : null}

      {currentStep === "generate" ? (
        isGenerating ? (
          <AssignmentLoading key={stepPanelKey} />
        ) : (
          <div
            key="generate"
            className={`flow-step-panel flow-step-panel--${stepDirection}`}
          >
            <div className={surfaceFormClassName}>
            <div className="mb-3">
              <h2 className="section-title">Ready to Generate</h2>
              <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                Review your configuration before starting AI generation.
              </p>
            </div>

            <div className="space-y-3 rounded-[var(--radius-input)] border border-[var(--border-light)] bg-[var(--surface-muted)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Title</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {form.title}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Topic</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {form.topic}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Questions</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {form.numberOfQuestions} × {form.marksPerQuestion} marks
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">Materials</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {uploadedFiles.length} file{uploadedFiles.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={goToPreviousStep}
                disabled={isSubmitting}
                className="outline-pill-btn w-full sm:w-auto"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isSubmitting}
                className={`${primaryButtonClassName} w-full sm:w-auto`}
              >
                <Sparkles className="h-4 w-4" strokeWidth={2} />
                {isSubmitting ? "Starting..." : "Generate Assignment"}
              </button>
            </div>
          </div>
          </div>
        )
      ) : null}

      {currentStep === "preview" && previewAssignment ? (
        <AssignmentPreview
          key="preview"
          assignment={previewAssignment}
          previewError={previewError}
          onRegenerate={() => void handleRegenerate()}
          onRetry={handleRetryFromError}
          onBackFromError={() => {
            setStepDirection("back");
            setCurrentStep("generate");
          }}
          onEdit={() => {
            setStepDirection("back");
            setCurrentStep("details");
          }}
          onDone={handleFinish}
        />
      ) : null}
        </>
      ) : null}
    </section>
  );
}
