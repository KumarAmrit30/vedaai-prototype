import type { Request, Response } from "express";
export declare function createMockResponse(): Response & {
    statusCode: number;
    body: unknown;
};
export declare function createMockRequest(authUid?: string): Request;
//# sourceMappingURL=mock-request.d.ts.map