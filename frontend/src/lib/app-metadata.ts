import packageJson from "../../package.json";

export const APP_NAME = "ExamForge AI";

export const APP_VERSION = packageJson.version;

export function getAppEnvironment(): "development" | "production" {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}
