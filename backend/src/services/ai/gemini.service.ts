import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";
let genAI: GoogleGenerativeAI | undefined;

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not defined");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
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
    console.error("Gemini generateContent failed:", message);
    throw error instanceof Error ? error : new Error(message);
  }
}
