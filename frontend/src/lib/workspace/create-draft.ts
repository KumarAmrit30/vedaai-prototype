import {
  initialFormState,
  type CreateAssignmentForm,
} from "@/components/assignment/assignment-create-flow";
import type { FlowStepId } from "@/components/assignment/assignment-stepper";

const DRAFT_KEY = "veda:create-assignment-draft";
const DRAFT_SCHEMA_VERSION = 1;

const PERSISTABLE_STEPS: FlowStepId[] = ["details", "upload", "generate"];

const QUESTION_TYPE_VALUES = new Set([
  "short-answer",
  "multiple-choice",
  "long-answer",
  "true-false",
]);

export interface DraftQuestionConfig {
  questionType: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface DraftUploadMetadata {
  uploadedFileNames: string[];
  uploadedFileCount: number;
}

export interface CreateAssignmentDraft {
  version: number;
  form: CreateAssignmentForm;
  questionConfig: DraftQuestionConfig;
  currentStep: FlowStepId;
  savedAt: string;
  uploadMetadata: DraftUploadMetadata;
}

export interface SaveCreateDraftInput {
  form: CreateAssignmentForm;
  currentStep: FlowStepId;
  uploadedFileNames: string[];
}

function isPersistableStep(step: unknown): step is FlowStepId {
  return (
    typeof step === "string" &&
    PERSISTABLE_STEPS.includes(step as FlowStepId)
  );
}

function sanitizeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function sanitizeForm(raw: unknown): CreateAssignmentForm {
  const record =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};

  const questionType = sanitizeString(record.questionType);
  const normalizedQuestionType = QUESTION_TYPE_VALUES.has(questionType)
    ? questionType
    : "";

  return {
    title: sanitizeString(record.title),
    topic: sanitizeString(record.topic),
    dueDate: sanitizeString(record.dueDate),
    instructions: sanitizeString(record.instructions),
    questionType: normalizedQuestionType,
    numberOfQuestions: sanitizeString(record.numberOfQuestions),
    marksPerQuestion: sanitizeString(record.marksPerQuestion),
  };
}

function sanitizeQuestionConfig(
  raw: unknown,
  form: CreateAssignmentForm,
): DraftQuestionConfig {
  const record =
    raw && typeof raw === "object"
      ? (raw as Record<string, unknown>)
      : {};

  const questionType = sanitizeString(record.questionType) || form.questionType;
  const numberOfQuestions = Number(
    record.numberOfQuestions ?? form.numberOfQuestions,
  );
  const marksPerQuestion = Number(
    record.marksPerQuestion ?? form.marksPerQuestion,
  );

  return {
    questionType: QUESTION_TYPE_VALUES.has(questionType) ? questionType : "",
    numberOfQuestions: Number.isFinite(numberOfQuestions)
      ? Math.max(0, numberOfQuestions)
      : 0,
    marksPerQuestion: Number.isFinite(marksPerQuestion)
      ? Math.max(0, marksPerQuestion)
      : 0,
  };
}

function mergeFormWithQuestionConfig(
  form: CreateAssignmentForm,
  questionConfig: DraftQuestionConfig,
): CreateAssignmentForm {
  return {
    ...form,
    questionType: form.questionType || questionConfig.questionType,
    numberOfQuestions:
      form.numberOfQuestions ||
      (questionConfig.numberOfQuestions > 0
        ? String(questionConfig.numberOfQuestions)
        : ""),
    marksPerQuestion:
      form.marksPerQuestion ||
      (questionConfig.marksPerQuestion > 0
        ? String(questionConfig.marksPerQuestion)
        : ""),
  };
}

function sanitizeUploadMetadata(raw: unknown): DraftUploadMetadata {
  if (!raw || typeof raw !== "object") {
    return { uploadedFileNames: [], uploadedFileCount: 0 };
  }

  const record = raw as Record<string, unknown>;
  const names = Array.isArray(record.uploadedFileNames)
    ? record.uploadedFileNames
        .filter((name): name is string => typeof name === "string")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];

  const count =
    typeof record.uploadedFileCount === "number" &&
    Number.isFinite(record.uploadedFileCount)
      ? Math.max(0, Math.floor(record.uploadedFileCount))
      : names.length;

  return {
    uploadedFileNames: names,
    uploadedFileCount: Math.max(count, names.length),
  };
}

function extractLegacyUploadMetadata(raw: unknown): DraftUploadMetadata {
  if (!Array.isArray(raw)) {
    return { uploadedFileNames: [], uploadedFileCount: 0 };
  }

  const names = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = (item as Record<string, unknown>).name;
      return typeof name === "string" && name.trim() ? name.trim() : null;
    })
    .filter((name): name is string => Boolean(name));

  return {
    uploadedFileNames: names,
    uploadedFileCount: names.length,
  };
}

function buildQuestionConfig(form: CreateAssignmentForm): DraftQuestionConfig {
  return {
    questionType: form.questionType,
    numberOfQuestions: Number(form.numberOfQuestions) || 0,
    marksPerQuestion: Number(form.marksPerQuestion) || 0,
  };
}

function normalizeDraft(raw: unknown): CreateAssignmentDraft | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const savedAt =
    typeof record.savedAt === "string" && !Number.isNaN(Date.parse(record.savedAt))
      ? record.savedAt
      : new Date().toISOString();

  const form = mergeFormWithQuestionConfig(
    { ...initialFormState, ...sanitizeForm(record.form ?? record) },
    sanitizeQuestionConfig(record.questionConfig, sanitizeForm(record.form ?? record)),
  );

  const uploadMetadata = record.uploadMetadata
    ? sanitizeUploadMetadata(record.uploadMetadata)
    : extractLegacyUploadMetadata(record.uploadedFiles);

  const currentStep = isPersistableStep(record.currentStep)
    ? record.currentStep
    : "details";

  return {
    version:
      typeof record.version === "number" && Number.isFinite(record.version)
        ? record.version
        : DRAFT_SCHEMA_VERSION,
    form,
    questionConfig: sanitizeQuestionConfig(record.questionConfig, form),
    currentStep,
    savedAt,
    uploadMetadata,
  };
}

export function formatDraftRelativeTime(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "recently";

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function loadCreateDraft(): CreateAssignmentDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return normalizeDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCreateDraft(input: SaveCreateDraftInput): void {
  if (typeof window === "undefined") return;

  const uploadedFileNames = input.uploadedFileNames
    .map((name) => name.trim())
    .filter(Boolean);

  const currentStep = isPersistableStep(input.currentStep)
    ? input.currentStep
    : "details";

  const payload: CreateAssignmentDraft = {
    version: DRAFT_SCHEMA_VERSION,
    form: sanitizeForm(input.form),
    questionConfig: buildQuestionConfig(input.form),
    currentStep,
    savedAt: new Date().toISOString(),
    uploadMetadata: {
      uploadedFileNames,
      uploadedFileCount: uploadedFileNames.length,
    },
  };

  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

export function clearCreateDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

export function hasMeaningfulDraft(draft: CreateAssignmentDraft | null): boolean {
  if (!draft) return false;

  const { form, uploadMetadata } = draft;

  return Boolean(
    form.title.trim() ||
      form.topic.trim() ||
      form.instructions.trim() ||
      form.dueDate ||
      form.questionType ||
      form.numberOfQuestions ||
      form.marksPerQuestion ||
      uploadMetadata.uploadedFileCount > 0,
  );
}

export function hasRestoredUploadMetadata(
  metadata: DraftUploadMetadata | null | undefined,
): boolean {
  return Boolean(metadata && metadata.uploadedFileCount > 0);
}
