import type { Request, Response } from "express";
import { collectHealthReport } from "./health.service";

export function getHealth(_req: Request, res: Response): void {
  const report = collectHealthReport();
  const statusCode = report.status === "unhealthy" ? 503 : 200;

  res.status(statusCode).json(report);
}
