import {
  bulkDeleteAssignments,
  deleteAssignment,
  getAssignmentById,
} from "../../src/modules/assignment/assignment.controller";
import {
  findActiveAssignmentById,
  findActiveAssignmentsByIds,
} from "../../src/modules/assignment/assignment.queries";
import { Assignment } from "../../src/modules/assignment/assignment.model";
import {
  buildAssignmentFixture,
  getFixtureAssignmentId,
  USER_A,
  USER_B,
} from "../helpers/assignment-fixtures";
import { createMockRequest, createMockResponse } from "../helpers/mock-request";

jest.mock("../../src/middleware/upload.middleware", () => ({
  getUploadedFilePaths: jest.fn(() => []),
  uploadMaterials: { array: jest.fn() },
}));
jest.mock("../../src/services/material-parser.service", () => ({
  deleteUploadedFiles: jest.fn(),
  parseMaterialFiles: jest.fn(),
}));
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

const mockFindById = findActiveAssignmentById as jest.MockedFunction<
  typeof findActiveAssignmentById
>;
const mockFindByIds = findActiveAssignmentsByIds as jest.MockedFunction<
  typeof findActiveAssignmentsByIds
>;

const assignmentId = getFixtureAssignmentId();
const ownedAssignment = buildAssignmentFixture(USER_A);

describe("assignment ownership isolation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows the owner to read their assignment", async () => {
    mockFindById.mockImplementation(async (id, userId) => {
      if (id === assignmentId && userId === USER_A) {
        return ownedAssignment;
      }
      return null;
    });

    const req = createMockRequest(USER_A);
    req.params = { id: assignmentId };
    const res = createMockResponse();
    const next = jest.fn();

    await getAssignmentById(req, res, next);

    expect(res.statusCode).toBe(200);
    expect((res.body as { success: boolean }).success).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 404 when a foreign user reads an assignment", async () => {
    mockFindById.mockResolvedValue(null);

    const req = createMockRequest(USER_B);
    req.params = { id: assignmentId };
    const res = createMockResponse();
    const next = jest.fn();

    await getAssignmentById(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: "Assignment not found",
    });
  });

  it("returns 404 when a foreign user deletes an assignment", async () => {
    mockFindById.mockResolvedValue(null);

    const req = createMockRequest(USER_B);
    req.params = { id: assignmentId };
    const res = createMockResponse();
    const next = jest.fn();

    await deleteAssignment(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: "Assignment not found",
    });
  });

  it("returns 404 when a foreign user bulk-deletes an assignment", async () => {
    mockFindByIds.mockResolvedValue([]);

    const req = createMockRequest(USER_B);
    req.body = { assignmentIds: [assignmentId] };
    const res = createMockResponse();
    const next = jest.fn();

    await bulkDeleteAssignments(req, res, next);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: "One or more assignments not found",
    });
    expect(Assignment.updateMany).not.toHaveBeenCalled();
  });
});
