import type { Request, Response } from "express";
import { collectAIHealthReport, collectHealthReport } from "./health.service";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const report = await collectHealthReport();
  const statusCode = report.status === "unhealthy" ? 503 : 200;

  res.status(statusCode).json(report);
}

export async function getAIHealth(_req: Request, res: Response): Promise<void> {
  const report = await collectAIHealthReport();
  const statusCode = report.ok ? 200 : 503;

  res.status(statusCode).json(report);
}
