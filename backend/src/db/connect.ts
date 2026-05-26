import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  try {
    await mongoose.connect(uri);
    console.log("[SERVER] MongoDB connected successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[SERVER] MongoDB connection failed:", message);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log("[SERVER] MongoDB disconnected");
}
