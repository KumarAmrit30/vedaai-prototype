import { collectAIHealthReport } from "../../src/modules/health/health.service";
import { getAIProvider } from "../../src/services/ai/providers";

jest.mock("../../src/services/ai/providers", () => ({
  getAIProvider: jest.fn(),
}));

const mockGetAIProvider = getAIProvider as jest.MockedFunction<
  typeof getAIProvider
>;

describe("AI health endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns provider status and latency when health check succeeds", async () => {
    mockGetAIProvider.mockReturnValue({
      name: "VERTEX",
      model: "gemini-2.5-flash",
      healthCheck: jest.fn().mockResolvedValue({
        ok: true,
        latencyMs: 842,
      }),
    } as never);

    const report = await collectAIHealthReport();

    expect(report).toMatchObject({
      provider: "VERTEX",
      model: "gemini-2.5-flash",
      ok: true,
      latencyMs: 842,
    });
    expect(report.timestamp).toEqual(expect.any(String));
  });

  it("returns failure details when health check fails", async () => {
    mockGetAIProvider.mockReturnValue({
      name: "GROQ",
      model: "llama-3.3-70b-versatile",
      healthCheck: jest.fn().mockResolvedValue({
        ok: false,
        latencyMs: 1200,
        error: "Groq generation failed: upstream failure",
      }),
    } as never);

    const report = await collectAIHealthReport();

    expect(report).toMatchObject({
      provider: "GROQ",
      ok: false,
      latencyMs: 1200,
      error: "Groq generation failed: upstream failure",
    });
  });
});
