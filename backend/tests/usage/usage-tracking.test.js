"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("../../src/modules/user/user.service");
const user_model_1 = require("../../src/modules/user/user.model");
jest.mock("../../src/modules/user/user.model", () => ({
    User: {
        updateOne: jest.fn(),
    },
}));
const mockUpdateOne = user_model_1.User.updateOne;
describe("incrementAssignmentUsage", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("increments usage after a successful generation", async () => {
        mockUpdateOne.mockResolvedValue({
            acknowledged: true,
            matchedCount: 1,
            modifiedCount: 1,
            upsertedCount: 0,
            upsertedId: null,
        });
        await (0, user_service_1.incrementAssignmentUsage)("user-a");
        expect(mockUpdateOne).toHaveBeenCalledWith({ firebaseUid: "user-a" }, { $inc: { "usage.assignmentsGenerated": 1 } });
    });
    it("throws when the user does not exist", async () => {
        mockUpdateOne.mockResolvedValue({
            acknowledged: true,
            matchedCount: 0,
            modifiedCount: 0,
            upsertedCount: 0,
            upsertedId: null,
        });
        await expect((0, user_service_1.incrementAssignmentUsage)("missing-user")).rejects.toThrow("Cannot increment usage — user not found for uid missing-user");
    });
});
describe("usage tracking behavior", () => {
    it("does not decrement usage when assignments are deleted", () => {
        const userServiceSource = require("fs").readFileSync(require("path").join(__dirname, "../../src/modules/user/user.service.ts"), "utf8");
        expect(userServiceSource).toContain('"$inc": { "usage.assignmentsGenerated": 1 }');
        expect(userServiceSource).not.toContain('"$inc": { "usage.assignmentsGenerated": -1 }');
        expect(userServiceSource).not.toContain("decrementAssignmentUsage");
    });
    it("only increments usage from the worker after successful completion", () => {
        const workerSource = require("fs").readFileSync(require("path").join(__dirname, "../../src/queues/assignment.worker.ts"), "utf8");
        expect(workerSource).toContain("incrementAssignmentUsage(userId)");
        expect(workerSource).toContain("// Count usage only after a successful, validated completion.");
        const incrementIndex = workerSource.indexOf("incrementAssignmentUsage(userId)");
        const catchIndex = workerSource.indexOf("} catch (error)");
        expect(incrementIndex).toBeGreaterThan(-1);
        expect(catchIndex).toBeGreaterThan(incrementIndex);
    });
    it("does not increment usage in the failure path", () => {
        const workerSource = require("fs").readFileSync(require("path").join(__dirname, "../../src/queues/assignment.worker.ts"), "utf8");
        const failureBlock = workerSource.slice(workerSource.indexOf("} catch (error)"));
        expect(failureBlock).not.toContain("incrementAssignmentUsage");
    });
});
//# sourceMappingURL=usage-tracking.test.js.map