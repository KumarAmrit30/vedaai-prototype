import fs from "node:fs/promises";
import path from "node:path";
import pdf from "pdf-parse";
import type { MaterialSource } from "../modules/assignment/assignment.types";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_MATERIAL_CHARS = 50_000;

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "text/plain"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ".txt"]);

export function normalizeMaterialText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_MATERIAL_CHARS);
}

export function resolveMaterialFileType(
  fileName: string,
  mimeType: string,
): "pdf" | "txt" | null {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".pdf" || mimeType === "application/pdf") {
    return "pdf";
  }

  if (extension === ".txt" || mimeType === "text/plain") {
    return "txt";
  }

  return null;
}

export function isAllowedMaterialUpload(
  fileName: string,
  mimeType: string,
): boolean {
  const extension = path.extname(fileName).toLowerCase();
  return (
    ALLOWED_EXTENSIONS.has(extension) &&
    (mimeType === "application/octet-stream" || ALLOWED_MIME_TYPES.has(mimeType))
  );
}

async function parsePdfFile(
  filePath: string,
  originalName: string,
): Promise<string> {
  console.log("[PDF] Extracting text", { fileName: originalName, filePath });

  try {
    const buffer = await fs.readFile(filePath);
    const result = await pdf(buffer);
    const text = normalizeMaterialText(result.text ?? "");

    console.log("[PDF] Extraction complete", {
      fileName: originalName,
      textLength: text.length,
      pages: result.numpages,
    });

    if (!text.trim()) {
      throw new Error("No readable text could be extracted from the PDF.");
    }

    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF error";
    console.error("[PDF] Extraction failed", {
      fileName: originalName,
      error: message,
    });
    throw new Error(
      `Failed to extract text from PDF "${originalName}": ${message}`,
    );
  }
}

async function parseTxtFile(
  filePath: string,
  originalName: string,
): Promise<string> {
  console.log("[TXT] Reading file", { fileName: originalName, filePath });

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const text = normalizeMaterialText(content);

    console.log("[TXT] Read complete", {
      fileName: originalName,
      textLength: text.length,
    });

    if (!text.trim()) {
      throw new Error("The text file is empty.");
    }

    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown TXT error";
    console.error("[TXT] Read failed", {
      fileName: originalName,
      error: message,
    });
    throw new Error(`Failed to read text file "${originalName}": ${message}`);
  }
}

export interface ParsedMaterialFile {
  text: string;
  source: MaterialSource;
  materialSourceType: "pdf" | "txt";
  originalFileName: string;
}

export async function parseMaterialFile(file: {
  path: string;
  originalname: string;
  mimetype: string;
  size: number;
}): Promise<ParsedMaterialFile> {
  const fileType = resolveMaterialFileType(file.originalname, file.mimetype);

  if (!fileType) {
    throw new Error(`Unsupported file type: ${file.originalname}`);
  }

  console.log("[UPLOAD] Parsing material file", {
    fileName: file.originalname,
    fileType,
    size: file.size,
    mimeType: file.mimetype,
  });

  const text =
    fileType === "pdf"
      ? await parsePdfFile(file.path, file.originalname)
      : await parseTxtFile(file.path, file.originalname);

  if (!text.trim()) {
    throw new Error(`No usable content found in ${file.originalname}.`);
  }

  return {
    text,
    materialSourceType: fileType,
    originalFileName: file.originalname,
    source: {
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
      charCount: text.length,
    },
  };
}

export async function deleteUploadedFiles(filePaths: string[]): Promise<void> {
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath);
        console.log("[UPLOAD] Deleted temp file", { filePath });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn("[UPLOAD] Failed to delete temp file", { filePath, error: message });
      }
    }),
  );
}

export interface ParsedMaterialResult {
  materialText: string;
  materialSourceType: "pdf" | "txt";
  originalFileName: string;
  materialSource: MaterialSource;
}

export async function parseMaterialFiles(
  files: Array<{
    path: string;
    originalname: string;
    mimetype: string;
    size: number;
  }>,
): Promise<ParsedMaterialResult> {
  if (files.length === 0) {
    throw new Error("No material files were uploaded.");
  }

  console.log("[UPLOAD] Processing batch", { fileCount: files.length });

  const parsed = await Promise.all(files.map((file) => parseMaterialFile(file)));
  const materialText = normalizeMaterialText(
    parsed.map((item) => item.text).join("\n\n---\n\n"),
  );

  const primary = parsed[0];
  if (!primary) {
    throw new Error("Failed to parse uploaded material.");
  }

  const materialSource: MaterialSource = {
    fileName:
      parsed.length === 1
        ? primary.originalFileName
        : `${primary.originalFileName} +${parsed.length - 1} more`,
    fileType: primary.materialSourceType,
    fileSize: parsed.reduce((total, item) => total + item.source.fileSize, 0),
    charCount: materialText.length,
  };

  console.log("[UPLOAD] Batch parsed", {
    originalFileName: materialSource.fileName,
    materialSourceType: primary.materialSourceType,
    textLength: materialText.length,
    fileCount: parsed.length,
  });

  return {
    materialText,
    materialSourceType: primary.materialSourceType,
    originalFileName: materialSource.fileName,
    materialSource,
  };
}
