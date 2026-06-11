"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assignment_controller_1 = require("../../src/modules/assignment/assignment.controller");
const assignment_queries_1 = require("../../src/modules/assignment/assignment.queries");
const assignment_model_1 = require("../../src/modules/assignment/assignment.model");
const assignment_fixtures_1 = require("../helpers/assignment-fixtures");
const mock_request_1 = require("../helpers/mock-request");
jest.mock("../../src/modules/assignment/assignment.queries");
jest.mock("../../src/modules/assignment/assignment.model", () => ({
    Assignment: {
        updateMany: jest.fn(),
    },
}));
jest.mock("../../src/socket/assignment.socket", () => ({
    emitAssignmentDeleted: jest.fn(),
    emitAssignmentUpdated: jest.fn(),
}));
const mockFindById = assignment_queries_1.findActiveAssignmentById;
const mockFindByIds = assignment_queries_1.findActiveAssignmentsByIds;
const assignmentId = (0, assignment_fixtures_1.getFixtureAssignmentId)();
const ownedAssignment = (0, assignment_fixtures_1.buildAssignmentFixture)(assignment_fixtures_1.USER_A);
describe("assignment ownership isolation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("allows the owner to read their assignment", async () => {
        mockFindById.mockImplementation(async (id, userId) => {
            if (id === assignmentId && userId === assignment_fixtures_1.USER_A) {
                return ownedAssignment;
            }
            return null;
        });
        const req = (0, mock_request_1.createMockRequest)(assignment_fixtures_1.USER_A);
        req.params = { id: assignmentId };
        const res = (0, mock_request_1.createMockResponse)();
        const next = jest.fn();
        await (0, assignment_controller_1.getAssignmentById)(req, res, next);
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(next).not.toHaveBeenCalled();
    });
    it("returns 404 when a foreign user reads an assignment", async () => {
        mockFindById.mockResolvedValue(null);
        const req = (0, mock_request_1.createMockRequest)(assignment_fixtures_1.USER_B);
        req.params = { id: assignmentId };
        const res = (0, mock_request_1.createMockResponse)();
        const next = jest.fn();
        await (0, assignment_controller_1.getAssignmentById)(req, res, next);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            success: false,
            message: "Assignment not found",
        });
    });
    it("returns 404 when a foreign user deletes an assignment", async () => {
        mockFindById.mockResolvedValue(null);
        const req = (0, mock_request_1.createMockRequest)(assignment_fixtures_1.USER_B);
        req.params = { id: assignmentId };
        const res = (0, mock_request_1.createMockResponse)();
        const next = jest.fn();
        await (0, assignment_controller_1.deleteAssignment)(req, res, next);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            success: false,
            message: "Assignment not found",
        });
    });
    it("returns 404 when a foreign user bulk-deletes an assignment", async () => {
        mockFindByIds.mockResolvedValue([]);
        const req = (0, mock_request_1.createMockRequest)(assignment_fixtures_1.USER_B);
        req.body = { assignmentIds: [assignmentId] };
        const res = (0, mock_request_1.createMockResponse)();
        const next = jest.fn();
        await (0, assignment_controller_1.bulkDeleteAssignments)(req, res, next);
        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            success: false,
            message: "One or more assignments not found",
        });
        expect(assignment_model_1.Assignment.updateMany).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=ownership-isolation.test.js.map