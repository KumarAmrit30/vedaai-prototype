import rateLimit from "express-rate-limit";
import { logWarn } from "../utils/logger";

/** 10 assignments/hour/IP — limits burst Groq usage while allowing normal educator workflows. */
const ASSIGNMENT_CREATION_WINDOW_MS = 60 * 60 * 1000;
const ASSIGNMENT_CREATION_MAX_PER_IP = 10;

export const assignmentCreationRateLimit = rateLimit({
  windowMs: ASSIGNMENT_CREATION_WINDOW_MS,
  max: ASSIGNMENT_CREATION_MAX_PER_IP,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logWarn("[RATE_LIMIT] Assignment generation limit reached", {
      ip: req.ip,
      route: `${req.method} ${req.originalUrl}`,
    });

    res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
    });
  },
});
