import { isRetryableAIError, retryAIRequest } from "../../src/services/ai/retry-ai-request";
import { AIRequestTimeoutError } from "../../src/services/ai/request-timeout";

describe("isRetryableAIError", () => {
  it("retries timeouts and transient network failures", () => {
    expect(
      isRetryableAIError(
        new AIRequestTimeoutError("Groq", "llama-3.3-70b-versatile", 45_000),
      ),
    ).toBe(true);

    expect(
      isRetryableAIError(
        Object.assign(new Error("fetch failed"), { code: "ECONNRESET" }),
      ),
    ).toBe(true);

    expect(
      isRetryableAIError(Object.assign(new Error("upstream failure"), { status: 503 })),
    ).toBe(true);
  });

  it("does not retry validation, parse, billing, or quota failures", () => {
    expect(
      isRetryableAIError(new Error("Failed to parse AI response as JSON: Unexpected token")),
    ).toBe(false);

    expect(
      isRetryableAIError(
        new Error("AI response validation failed: expected 3 questions but generated 1"),
      ),
    ).toBe(false);

    expect(
      isRetryableAIError(
        Object.assign(new Error("Insufficient credits for this request"), { status: 402 }),
      ),
    ).toBe(false);

    expect(
      isRetryableAIError(
        Object.assign(new Error("Rate limit reached for requests"), { status: 429 }),
      ),
    ).toBe(false);

    expect(
      isRetryableAIError(
        Object.assign(new Error("Invalid API Key"), { status: 401 }),
      ),
    ).toBe(false);
  });
});

describe("retryAIRequest", () => {
  it("retries only once for retryable provider failures", async () => {
    const request = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("upstream failure"), { status: 503 }))
      .mockResolvedValueOnce("ok");

    const result = await retryAIRequest({
      provider: "Groq",
      model: "llama-3.3-70b-versatile",
      request,
    });

    expect(result).toEqual({ data: "ok", retryCount: 1 });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable validation failures", async () => {
    const request = jest
      .fn()
      .mockRejectedValue(
        new Error("AI response validation failed: answerKey must contain exactly 3 entries"),
      );

    await expect(
      retryAIRequest({
        provider: "Groq",
        model: "llama-3.3-70b-versatile",
        request,
      }),
    ).rejects.toThrow(/validation failed/i);

    expect(request).toHaveBeenCalledTimes(1);
  });
});
