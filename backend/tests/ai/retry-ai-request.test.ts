import {
  computeRetryDelayMs,
  isRetryableAIError,
  MAX_ATTEMPTS,
  retryAIRequest,
} from "../../src/services/ai/retry-ai-request";
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

  it("retries HTTP 429 rate limit responses", () => {
    expect(
      isRetryableAIError(
        Object.assign(new Error("Rate limit reached for requests"), { status: 429 }),
      ),
    ).toBe(true);
  });

  it("does not retry validation, parse, billing, or auth failures", () => {
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
        Object.assign(new Error("Invalid API Key"), { status: 401 }),
      ),
    ).toBe(false);
  });
});

describe("computeRetryDelayMs", () => {
  it("applies exponential backoff capped at 15s plus jitter", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);

    expect(computeRetryDelayMs(1)).toBe(2250);
    expect(computeRetryDelayMs(2)).toBe(4250);
    expect(computeRetryDelayMs(3)).toBe(8250);
    expect(computeRetryDelayMs(10)).toBe(15250);

    jest.restoreAllMocks();
  });
});

describe("retryAIRequest", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("retries retryable provider failures up to MAX_ATTEMPTS", async () => {
    const request = jest
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("upstream failure"), { status: 503 }))
      .mockRejectedValueOnce(Object.assign(new Error("rate limited"), { status: 429 }))
      .mockRejectedValueOnce(Object.assign(new Error("upstream failure"), { status: 503 }))
      .mockResolvedValueOnce("ok");

    const resultPromise = retryAIRequest({
      provider: "Groq",
      model: "llama-3.3-70b-versatile",
      request,
    });

    await jest.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ data: "ok", retryCount: 3 });
    expect(request).toHaveBeenCalledTimes(4);
    expect(MAX_ATTEMPTS).toBe(4);
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
