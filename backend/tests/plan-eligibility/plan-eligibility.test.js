"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plan_eligibility_service_1 = require("../../src/modules/user/plan-eligibility.service");
const assignment_queries_1 = require("../../src/modules/assignment/assignment.queries");
const plan_config_1 = require("../../src/modules/billing/plan.config");
const user_fixtures_1 = require("../helpers/user-fixtures");
jest.mock("../../src/modules/assignment/assignment.queries", () => ({
    countInFlightAssignments: jest.fn(),
}));
const mockCountInFlight = assignment_queries_1.countInFlightAssignments;
describe("checkGenerationEligibility", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("allows a free user with completed=0 and inFlight=0", async () => {
        mockCountInFlight.mockResolvedValue(0);
        const user = (0, user_fixtures_1.buildUserFixture)("free", 0);
        const result = await (0, plan_eligibility_service_1.checkGenerationEligibility)(user);
        expect(result).toEqual({
            allowed: true,
            limit: 3,
            completedCount: 0,
            inFlightCount: 0,
            effectiveCount: 0,
        });
        expect(result.limit).toBe((0, plan_config_1.getAssignmentLimit)("free"));
        expect((0, plan_config_1.serializeAssignmentLimit)("free")).toBe(3);
    });
    it("allows a free user with completed=2 and inFlight=0", async () => {
        mockCountInFlight.mockResolvedValue(0);
        const user = (0, user_fixtures_1.buildUserFixture)("free", 2);
        const result = await (0, plan_eligibility_service_1.checkGenerationEligibility)(user);
        expect(result.allowed).toBe(true);
        expect(result.completedCount).toBe(2);
        expect(result.inFlightCount).toBe(0);
        expect(result.effectiveCount).toBe(2);
        expect(result.limit).toBe(3);
    });
    it("blocks a free user with completed=2 and inFlight=1", async () => {
        mockCountInFlight.mockResolvedValue(1);
        const user = (0, user_fixtures_1.buildUserFixture)("free", 2);
        const result = await (0, plan_eligibility_service_1.checkGenerationEligibility)(user);
        expect(result.allowed).toBe(false);
        expect(result.completedCount).toBe(2);
        expect(result.inFlightCount).toBe(1);
        expect(result.effectiveCount).toBe(3);
        expect(result.limit).toBe(3);
    });
    it("blocks a free user with completed=3 and inFlight=0", async () => {
        mockCountInFlight.mockResolvedValue(0);
        const user = (0, user_fixtures_1.buildUserFixture)("free", 3);
        const result = await (0, plan_eligibility_service_1.checkGenerationEligibility)(user);
        expect(result.allowed).toBe(false);
        expect(result.completedCount).toBe(3);
        expect(result.inFlightCount).toBe(0);
        expect(result.effectiveCount).toBe(3);
        expect(result.limit).toBe(3);
    });
    it("allows a pro user regardless of usage", async () => {
        const user = (0, user_fixtures_1.buildUserFixture)("pro", 25);
        const result = await (0, plan_eligibility_service_1.checkGenerationEligibility)(user);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(Number.POSITIVE_INFINITY);
        expect(result.completedCount).toBe(25);
        expect(result.inFlightCount).toBe(0);
        expect((0, plan_config_1.serializeAssignmentLimit)("pro")).toBeNull();
        expect(mockCountInFlight).not.toHaveBeenCalled();
    });
    it("allows an enterprise user regardless of usage", async () => {
        const user = (0, user_fixtures_1.buildUserFixture)("enterprise", 100);
        const result = await (0, plan_eligibility_service_1.checkGenerationEligibility)(user);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(Number.POSITIVE_INFINITY);
        expect(result.completedCount).toBe(100);
        expect(result.inFlightCount).toBe(0);
        expect((0, plan_config_1.serializeAssignmentLimit)("enterprise")).toBeNull();
        expect(mockCountInFlight).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=plan-eligibility.test.js.map