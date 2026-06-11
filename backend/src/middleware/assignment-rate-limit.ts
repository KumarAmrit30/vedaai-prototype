import type { Request } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { logWarn } from "../utils/logger";

/** 10 assignments/hour per user (UID) or IP — limits burst AI usage while allowing normal educator workflows. */
const ASSIGNMENT_CREATION_WINDOW_MS = 60 * 60 * 1000;
const ASSIGNMENT_CREATION_MAX_PER_KEY = 10;

function resolveRateLimitKey(req: Request): {
  key: string;
  keyType: "uid" | "ip";
} {
  if (env.authEnabled && req.auth?.uid) {
    return { key: req.auth.uid, keyType: "uid" };
  }

  return { key: req.ip ?? "unknown", keyType: "ip" };
}

export const assignmentCreationRateLimit = rateLimit({
  windowMs: ASSIGNMENT_CREATION_WINDOW_MS,
  max: ASSIGNMENT_CREATION_MAX_PER_KEY,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => resolveRateLimitKey(req).key,
  handler: (req, res) => {
    const { key, keyType } = resolveRateLimitKey(req);

    logWarn("[RATE_LIMIT] Assignment generation limit reached", {
      keyType,
      ...(keyType === "uid" ? { uid: key } : { ip: key }),
      route: `${req.method} ${req.originalUrl}`,
    });

    res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    });
  },
});
