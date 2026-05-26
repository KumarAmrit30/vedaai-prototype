import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { MAX_UPLOAD_BYTES } from "../services/material-parser.service";

export function uploadErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "Uploaded file exceeds the 10MB size limit.",
      });
      return;
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      res.status(400).json({
        success: false,
        message: "You can upload up to 3 material files at a time.",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (isMaterialUploadError(err)) {
    console.warn("[UPLOAD] Rejected material upload", { message: err.message });
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  next(err);
}

export function assertUploadWithinLimit(size: number): void {
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error("Uploaded file exceeds the 10MB size limit.");
  }
}

export function isMaterialUploadError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;

  return (
    error.message.includes("Only PDF and TXT") ||
    error.message.includes("Unsupported file type") ||
    error.message.includes("No readable text") ||
    error.message.includes("text file is empty") ||
    error.message.includes("Failed to extract text from PDF") ||
    error.message.includes("Failed to read text file") ||
    error.message.includes("No usable content found") ||
    error.message.includes("No material files were uploaded") ||
    error.message.includes("10MB size limit")
  );
}
