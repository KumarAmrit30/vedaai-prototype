import fs from "node:fs";
import path from "node:path";
import type { Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import { randomUUID } from "node:crypto";
import {
  isAllowedMaterialUpload,
  MAX_UPLOAD_BYTES,
} from "../services/material-parser.service";

export const UPLOADS_DIR = path.join("/tmp", "uploads");

function ensureUploadsDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    ensureUploadsDir();
    callback(null, UPLOADS_DIR);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".bin";
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
): void {
  if (!isAllowedMaterialUpload(file.originalname, file.mimetype)) {
    console.warn("[UPLOAD] Rejected unsupported file type", {
      fileName: file.originalname,
      mimeType: file.mimetype,
    });
    callback(
      new Error("Only PDF and TXT files are allowed for source material."),
    );
    return;
  }

  console.log("[UPLOAD] Accepted file", {
    fileName: file.originalname,
    mimeType: file.mimetype,
  });

  callback(null, true);
}

export const uploadMaterials = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_BYTES,
    files: 3,
  },
  fileFilter,
});

export function getUploadedFilePaths(
  files: Express.Multer.File | Express.Multer.File[] | undefined,
): string[] {
  if (!files) return [];
  const list = Array.isArray(files) ? files : [files];
  return list.map((file) => file.path);
}
