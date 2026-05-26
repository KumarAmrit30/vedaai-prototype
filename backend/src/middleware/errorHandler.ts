import type { NextFunction, Request, Response } from "express";
import multer from "multer";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file exceeds the 10MB size limit."
        : err.message;

    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
}
