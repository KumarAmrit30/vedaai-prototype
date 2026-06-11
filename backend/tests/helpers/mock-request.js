"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockResponse = createMockResponse;
exports.createMockRequest = createMockRequest;
function createMockResponse() {
    const res = {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
    return res;
}
function createMockRequest(authUid) {
    return {
        auth: authUid ? { uid: authUid } : undefined,
        params: {},
        body: {},
        files: undefined,
    };
}
//# sourceMappingURL=mock-request.js.map