import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { logWarn } from "../utils/logger";

function formatValidationErrors(
  issues: { path: PropertyKey[]; message: string }[],
): { field: string; message: string }[] {
  return issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.map(String).join(".") : "body",
    message: issue.message,
  }));
}

export function validateRequest<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatValidationErrors(result.error.issues);

      logWarn("[VALIDATION] Request rejected", {
        route: `${req.method} ${req.originalUrl}`,
        errorCount: errors.length,
      });

      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
