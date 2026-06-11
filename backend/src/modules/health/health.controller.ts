import type { Request, Response } from "express";
import { collectHealthReport } from "./health.service";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const report = await collectHealthReport();
  const statusCode = report.status === "unhealthy" ? 503 : 200;

  res.status(statusCode).json(report);
}
