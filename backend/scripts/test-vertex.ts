/**
 * Phase 3.5 — Vertex AI validation script.
 *
 * Uses Application Default Credentials (local):
 *   gcloud auth application-default login
 *   gcloud config set project aarogya-vault-dev
 *
 * Run: npm run test:vertex
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { SchemaType, VertexAI } from "@google-cloud/vertexai";

loadEnv({ path: resolve(__dirname, "../.env") });

const GCP_PROJECT_ID =
  process.env.GCP_PROJECT_ID?.trim() ?? "aarogya-vault-dev";
const VERTEX_LOCATION =
  process.env.VERTEX_LOCATION?.trim() ?? "asia-south1";
const VERTEX_MODEL =
  process.env.VERTEX_MODEL?.trim() ?? "gemini-2.5-flash";

const SAMPLE_EXAM_PROMPT = `You are an academic assessment generator.

Generate a small sample quiz as a single JSON object with this exact structure:
{
  "sections": [
    {
      "title": "Sample Section",
      "instruction": "Answer all questions.",
      "questions": [
        {
          "question": "What is 2 + 2?",
          "difficulty": "easy",
          "marks": 2
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": 1,
      "answer": "4",
      "explanation": "Two plus two equals four.",
      "markingGuide": "Award full marks for the correct numeric answer."
    }
  ]
}

Topic: Basic arithmetic
Instructions: Create exactly 1 question for validation testing.
Return ONLY valid JSON. No markdown.`;

function printRemediation(): void {
  console.error("\n--- ADC authentication failed ---\n");
  console.error("Remediation steps:");
  console.error("  1. gcloud auth application-default login");
  console.error("  2. gcloud config set project aarogya-vault-dev");
  console.error("  3. gcloud auth application-default print-access-token");
  console.error("\nFor Render (later), use a dedicated service account JSON:");
  console.error("  examforge-vertex@aarogya-vault-dev.iam.gserviceaccount.com");
  console.error("  GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json\n");
}

function extractUsageMetadata(response: {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}): Record<string, number | undefined> {
  const usage = response.usageMetadata;
  return {
    promptTokenCount: usage?.promptTokenCount,
    candidatesTokenCount: usage?.candidatesTokenCount,
    totalTokenCount: usage?.totalTokenCount,
    thoughtsTokenCount: usage?.thoughtsTokenCount,
  };
}

async function main(): Promise<void> {
  console.log("=== Vertex AI Validation (Phase 3.5) ===\n");
  console.log("Configuration:");
  console.log(`  project:  ${GCP_PROJECT_ID}`);
  console.log(`  location: ${VERTEX_LOCATION}`);
  console.log(`  model:    ${VERTEX_MODEL}`);
  console.log(`  auth:     ADC (Application Default Credentials)\n`);

  const startedAt = Date.now();

  try {
    const vertexAI = new VertexAI({
      project: GCP_PROJECT_ID,
      location: VERTEX_LOCATION,
    });

    const pingModel = vertexAI.getGenerativeModel({
      model: VERTEX_MODEL,
      generationConfig: {
        maxOutputTokens: 32,
        temperature: 0,
      },
    });

    const examModel = vertexAI.getGenerativeModel({
      model: VERTEX_MODEL,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            sections: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  instruction: { type: SchemaType.STRING },
                  questions: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        question: { type: SchemaType.STRING },
                        difficulty: { type: SchemaType.STRING },
                        marks: { type: SchemaType.NUMBER },
                      },
                      required: ["question", "difficulty", "marks"],
                    },
                  },
                },
                required: ["title", "instruction", "questions"],
              },
            },
            answerKey: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  questionNumber: { type: SchemaType.NUMBER },
                  answer: { type: SchemaType.STRING },
                  explanation: { type: SchemaType.STRING },
                  markingGuide: { type: SchemaType.STRING },
                },
                required: [
                  "questionNumber",
                  "answer",
                  "explanation",
                  "markingGuide",
                ],
              },
            },
          },
          required: ["sections", "answerKey"],
        },
        maxOutputTokens: 2048,
        temperature: 0,
      },
    });

    console.log("Step 1: Connectivity ping — prompt: \"Reply with OK\"");
    const pingStart = Date.now();
    const pingResult = await pingModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: "Reply with OK" }],
        },
      ],
    });
    const pingLatencyMs = Date.now() - pingStart;
    const pingText = (pingResult.response.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    console.log(`  ✓ Ping response: ${pingText}`);
    console.log(`  ✓ Ping latency: ${pingLatencyMs}ms`);
    console.log(
      `  ✓ Ping usage: ${JSON.stringify(extractUsageMetadata(pingResult.response))}\n`,
    );

    console.log("Step 2: Sample exam paper generation");
    const examStart = Date.now();
    const examResult = await examModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: SAMPLE_EXAM_PROMPT }],
        },
      ],
    });
    const examLatencyMs = Date.now() - examStart;

    const examText = (examResult.response.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!examText) {
      throw new Error("Vertex returned an empty exam response");
    }

    const parsed = JSON.parse(examText) as {
      sections?: unknown[];
      answerKey?: unknown[];
    };

    const totalLatencyMs = Date.now() - startedAt;
    const examUsage = extractUsageMetadata(examResult.response);

    console.log(`  ✓ Exam latency: ${examLatencyMs}ms`);
    console.log(`  ✓ Total script latency: ${totalLatencyMs}ms`);
    console.log(`  ✓ Token usage: ${JSON.stringify(examUsage, null, 2)}`);
    console.log(
      "  ℹ Cost metadata: Vertex API does not return billing amounts in the response.",
    );
    console.log(
      "    Estimate cost from token counts via GCP Pricing / Billing console.",
    );
    console.log(`  ✓ Sections generated: ${parsed.sections?.length ?? 0}`);
    console.log(`  ✓ Answer key entries: ${parsed.answerKey?.length ?? 0}`);
    console.log("\n--- Sample response (truncated) ---");
    console.log(examText.slice(0, 1200));
    if (examText.length > 1200) {
      console.log(`\n... (${examText.length} chars total)`);
    }

    console.log("\n=== Vertex validation PASSED ===\n");
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const latencyMs = Date.now() - startedAt;

    console.error(`\n✗ Vertex validation FAILED after ${latencyMs}ms`);
    console.error(`  Error: ${message}\n`);

    if (
      message.includes("Could not load the default credentials") ||
      message.includes("UNAUTHENTICATED") ||
      message.includes("invalid_grant") ||
      message.includes("Getting metadata from plugin")
    ) {
      printRemediation();
    }

    process.exit(1);
  }
}

void main();
