export class VertexGenerationTruncatedError extends Error {
  readonly finishReason = "MAX_TOKENS";

  constructor(message = "Vertex generation truncated (MAX_TOKENS).") {
    super(message);
    this.name = "VertexGenerationTruncatedError";
  }
}

export class VertexGenerationBlockedError extends Error {
  readonly finishReason: "SAFETY" | "RECITATION";

  constructor(
    finishReason: "SAFETY" | "RECITATION",
    message?: string,
  ) {
    super(
      message ??
        `Vertex generation blocked (${finishReason}).`,
    );
    this.name = "VertexGenerationBlockedError";
    this.finishReason = finishReason;
  }
}
