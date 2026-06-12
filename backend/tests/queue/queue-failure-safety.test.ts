import { Types } from "mongoose";
import { createAssignment } from "../../src/modules/assignment/assignment.controller";
import { Assignment } from "../../src/modules/assignment/assignment.model";
import { checkGenerationEligibility } from "../../src/modules/user/plan-eligibility.service";
import {
  findUserByFirebaseUid,
  upsertUserFromFirebaseClaims,
} from "../../src/modules/user/user.service";
import { enqueueAssignmentGeneration } from "../../src/queues/assignment.queue";
import {
  QUEUE_UNAVAILABLE_CODE,
  QUEUE_UNAVAILABLE_MESSAGE,
  QueueUnavailableError,
} from "../../src/queues/queue-unavailable.error";
import { errorHandler } from "../../src/middleware/errorHandler";
import { createMockRequest, createMockResponse } from "../helpers/mock-request";

jest.mock("../../src/middleware/upload.middleware", () => ({
  getUploadedFilePaths: jest.fn(() => []),
  uploadMaterials: { array: jest.fn() },
}));
jest.mock("../../src/services/material-parser.service", () => ({
  deleteUploadedFiles: jest.fn(),
  parseMaterialFiles: jest.fn(),
}));
jest.mock("../../src/modules/user/user.service", () => ({
  findUserByFirebaseUid: jest.fn(),
  upsertUserFromFirebaseClaims: jest.fn(),
}));
jest.mock("../../src/modules/user/plan-eligibility.service", () => ({
  checkGenerationEligibility: jest.fn(),
}));
jest.mock("../../src/queues/assignment.queue", () => ({
  enqueueAssignmentGeneration: jest.fn(),
}));
jest.mock("../../src/modules/assignment/assignment.model", () => ({
  Assignment: {
    create: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

const mockCreate = Assignment.create as jest.MockedFunction<typeof Assignment.create>;
const mockDeleteOne = Assignment.deleteOne as jest.MockedFunction<
  typeof Assignment.deleteOne
>;
const mockEnqueue = enqueueAssignmentGeneration as jest.MockedFunction<
  typeof enqueueAssignmentGeneration
>;
const mockFindUser = findUserByFirebaseUid as jest.MockedFunction<
  typeof findUserByFirebaseUid
>;
const mockUpsertUser = upsertUserFromFirebaseClaims as jest.MockedFunction<
  typeof upsertUserFromFirebaseClaims
>;
const mockEligibility = checkGenerationEligibility as jest.MockedFunction<
  typeof checkGenerationEligibility
>;

const ASSIGNMENT_ID = new Types.ObjectId();
const USER_ID = "user-a";

function buildCreatedAssignment() {
  return {
    _id: ASSIGNMENT_ID,
    userId: USER_ID,
    title: "Midterm Review",
    topic: "Biology",
    dueDate: new Date("2026-06-15T00:00:00.000Z"),
    instructions: "Answer all questions.",
    questionConfig: {
      questionType: "short-answer",
      numberOfQuestions: 2,
      marksPerQuestion: 2,
    },
    status: "pending",
    progress: 0,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function buildCreateRequest() {
  const req = createMockRequest(USER_ID);
  req.body = {
    title: "Midterm Review",
    topic: "Biology",
    dueDate: "2026-06-15T00:00:00.000Z",
    instructions: "Answer all questions.",
    questionConfig: {
      questionType: "short-answer",
      numberOfQuestions: 2,
      marksPerQuestion: 2,
    },
  };
  return req;
}

describe("queue failure safety", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUser.mockResolvedValue({ firebaseUid: USER_ID } as never);
    mockUpsertUser.mockResolvedValue({ firebaseUid: USER_ID } as never);
    mockEligibility.mockResolvedValue({
      allowed: true,
      limit: 3,
      completedCount: 0,
      inFlightCount: 0,
      effectiveCount: 0,
    });
    mockCreate.mockResolvedValue(buildCreatedAssignment() as never);
    mockDeleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
  });

  it("removes the assignment when enqueue fails", async () => {
    mockEnqueue.mockRejectedValue(new QueueUnavailableError());

    const req = buildCreateRequest();
    const res = createMockResponse();
    const next = jest.fn();

    await createAssignment(req, res, next);

    expect(mockDeleteOne).toHaveBeenCalledWith({ _id: ASSIGNMENT_ID });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns HTTP 503 when enqueue fails", async () => {
    mockEnqueue.mockRejectedValue(new QueueUnavailableError());

    const req = buildCreateRequest();
    const res = createMockResponse();
    const next = jest.fn();

    await createAssignment(req, res, next);

    expect(res.statusCode).toBe(503);
  });

  it("returns QUEUE_UNAVAILABLE response shape when enqueue fails", async () => {
    mockEnqueue.mockRejectedValue(new QueueUnavailableError());

    const req = buildCreateRequest();
    const res = createMockResponse();
    const next = jest.fn();

    await createAssignment(req, res, next);

    expect(res.body).toEqual({
      success: false,
      code: QUEUE_UNAVAILABLE_CODE,
      message: QUEUE_UNAVAILABLE_MESSAGE,
    });
  });

  it("does not leave orphan pending assignments when enqueue fails", async () => {
    mockEnqueue.mockRejectedValue(new QueueUnavailableError());

    const req = buildCreateRequest();
    const res = createMockResponse();
    const next = jest.fn();

    await createAssignment(req, res, next);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(503);
    expect((res.body as { code?: string }).code).toBe(QUEUE_UNAVAILABLE_CODE);
  });
});

describe("QueueUnavailableError handling", () => {
  it("maps QueueUnavailableError to HTTP 503 in the global error handler", () => {
    const res = createMockResponse();
    const next = jest.fn();

    errorHandler(new QueueUnavailableError(), createMockRequest(), res, next);

    expect(res.statusCode).toBe(503);
    expect(res.body).toEqual({
      success: false,
      code: QUEUE_UNAVAILABLE_CODE,
      message: QUEUE_UNAVAILABLE_MESSAGE,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
