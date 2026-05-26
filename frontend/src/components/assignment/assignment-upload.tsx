"use client";

import { FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export type UploadMaterialStatus = "ready" | "error";

export interface UploadedMaterial {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: UploadMaterialStatus;
  error?: string;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".txt"] as const;
const ACCEPTED_MIME = "application/pdf,text/plain,.pdf,.txt";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileBadge(name: string): "PDF" | "TXT" | "FILE" {
  const lowerName = name.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "PDF";
  if (lowerName.endsWith(".txt")) return "TXT";
  return "FILE";
}

export function validateMaterialFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext),
  );

  if (!hasValidExtension) {
    return "Only PDF and TXT files are supported.";
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return "File exceeds the 10MB size limit.";
  }

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  return null;
}

function buildMaterialFromFile(file: File): UploadedMaterial {
  const validationError = validateMaterialFile(file);

  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: validationError ? "error" : "ready",
    ...(validationError ? { error: validationError } : {}),
  };
}

interface AssignmentUploadProps {
  files: UploadedMaterial[];
  onFilesAdd: (files: UploadedMaterial[]) => void;
  onFileRemove: (id: string) => void;
}

export function AssignmentUpload({
  files,
  onFilesAdd,
  onFileRemove,
}: AssignmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      const materials = incoming.map(buildMaterialFromFile);
      const validCount = materials.filter((item) => item.status === "ready").length;

      if (validCount === 0) {
        setDropError(materials[0]?.error ?? "Unsupported file type.");
      } else {
        setDropError(null);
      }

      onFilesAdd(materials);
    },
    [onFilesAdd],
  );

  function handleDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    processFiles(event.dataTransfer.files);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    if (event.target.files) {
      processFiles(event.target.files);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="filter-pill filter-pill--active">PDF</span>
        <span className="filter-pill filter-pill--active">TXT</span>
        <span className="text-[11px] text-[var(--text-muted)]">
          Max 10MB per file
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`upload-dropzone cursor-pointer${
          isDragging ? " upload-dropzone--active" : ""
        }`}
      >
        <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-[14px] border border-[var(--border-light)] bg-[var(--surface)]">
          <Upload className="h-4 w-4 text-[var(--orange-primary)]" strokeWidth={2} />
        </div>
        <p className="text-[13px] font-medium text-[var(--text-primary)]">
          Drag & drop materials here
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
          PDF or TXT reference files for generation
        </p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            inputRef.current?.click();
          }}
          className="pill-button mt-3 text-[13px]"
        >
          <Upload className="h-4 w-4" strokeWidth={2.5} />
          Choose Files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIME}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden
        />
      </div>

      {dropError ? (
        <p className="text-[12px] font-medium text-[var(--danger)]">{dropError}</p>
      ) : files.length === 0 ? (
        <p className="text-[12px] text-[var(--text-muted)]">
          Upload is optional — skip this step if you don&apos;t have reference files.
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((material) => (
            <li
              key={material.id}
              className={`upload-file-card${
                material.status === "error" ? " upload-file-card--error" : ""
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-muted)]">
                <FileText
                  className="h-4 w-4 text-[var(--text-secondary)]"
                  strokeWidth={2}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {material.name}
                  </p>
                  <span className="filter-pill shrink-0 px-2 py-0.5 text-[10px]">
                    {getFileBadge(material.name)}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {formatFileSize(material.size)}
                  {material.status === "ready" ? " · Ready to upload" : null}
                </p>
                {material.error ? (
                  <p className="mt-1 text-[11px] font-medium text-[var(--danger)]">
                    {material.error}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                aria-label={`Remove ${material.name}`}
                onClick={() => onFileRemove(material.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--danger)]"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
