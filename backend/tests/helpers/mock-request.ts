import type { Request, Response } from "express";

export function createMockResponse(): Response & {
  statusCode: number;
  body: unknown;
} {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as Response & { statusCode: number; body: unknown };
}

export function createMockRequest(authUid?: string): Request {
  return {
    auth: authUid ? { uid: authUid } : undefined,
    params: {},
    body: {},
    files: undefined,
  } as Request;
}
