import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { logError } from "../../utils/logger";

const MODEL_NAME = "gemini-2.5-flash";
let genAI: GoogleGenerativeAI | undefined;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(env.geminiApiKey);
  }

  return genAI;
}

export async function generateContent(prompt: string): Promise<string> {
  try {
    const model = getClient().getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return text;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Gemini error";
    logError("[AI] Gemini generateContent failed", { message });
    throw error instanceof Error ? error : new Error(message);
  }
}
