import mongoose from "mongoose";
import { env } from "../config/env";
import { logError, logInfo } from "../utils/logger";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.mongodbUri);
    logInfo("[SERVER] MongoDB connected successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("[SERVER] MongoDB connection failed", { message });
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  logInfo("[SERVER] MongoDB disconnected");
}
