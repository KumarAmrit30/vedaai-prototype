import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";
import {
  QUEUE_UNAVAILABLE_CODE,
  QUEUE_UNAVAILABLE_MESSAGE,
  QueueUnavailableError,
} from "../queues/queue-unavailable.error";
import { logError } from "../utils/logger";

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

  if (err instanceof QueueUnavailableError) {
    res.status(503).json({
      success: false,
      code: QUEUE_UNAVAILABLE_CODE,
      message: QUEUE_UNAVAILABLE_MESSAGE,
    });
    return;
  }

  logError("[SERVER] Unhandled error", {
    message: err.message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });

  res.status(500).json({
    success: false,
    message: env.isProduction ? "Internal server error" : err.message,
    ...(!env.isProduction ? { error: err.message } : {}),
  });
}
