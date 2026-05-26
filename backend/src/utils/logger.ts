import { env } from "../config/env";

type LogMeta = Record<string, unknown>;

function formatMeta(meta?: LogMeta): LogMeta | undefined {
  return meta && Object.keys(meta).length > 0 ? meta : undefined;
}

export function logInfo(message: string, meta?: LogMeta): void {
  const details = formatMeta(meta);
  if (details) console.log(message, details);
  else console.log(message);
}

export function logWarn(message: string, meta?: LogMeta): void {
  const details = formatMeta(meta);
  if (details) console.warn(message, details);
  else console.warn(message);
}

export function logError(message: string, meta?: LogMeta): void {
  const details = formatMeta(meta);
  if (details) console.error(message, details);
  else console.error(message);
}

/** Verbose diagnostics — suppressed in production. */
export function logDebug(message: string, meta?: LogMeta): void {
  if (env.isProduction) return;

  const details = formatMeta(meta);
  if (details) console.log(message, details);
  else console.log(message);
}
