import { checkGenerationEligibility } from "../../src/modules/user/plan-eligibility.service";
import { countInFlightAssignments } from "../../src/modules/assignment/assignment.queries";
import { getAssignmentLimit, serializeAssignmentLimit } from "../../src/modules/billing/plan.config";
import { buildUserFixture } from "../helpers/user-fixtures";

jest.mock("../../src/modules/assignment/assignment.queries", () => ({
  countInFlightAssignments: jest.fn(),
}));

const mockCountInFlight = countInFlightAssignments as jest.MockedFunction<
  typeof countInFlightAssignments
>;

describe("checkGenerationEligibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("allows a free user with completed=0 and inFlight=0", async () => {
    mockCountInFlight.mockResolvedValue(0);
    const user = buildUserFixture("free", 0);

    const result = await checkGenerationEligibility(user);

    expect(result).toEqual({
      allowed: true,
      limit: 3,
      completedCount: 0,
      inFlightCount: 0,
      effectiveCount: 0,
    });
    expect(result.limit).toBe(getAssignmentLimit("free"));
    expect(serializeAssignmentLimit("free")).toBe(3);
  });

  it("allows a free user with completed=2 and inFlight=0", async () => {
    mockCountInFlight.mockResolvedValue(0);
    const user = buildUserFixture("free", 2);

    const result = await checkGenerationEligibility(user);

    expect(result.allowed).toBe(true);
    expect(result.completedCount).toBe(2);
    expect(result.inFlightCount).toBe(0);
    expect(result.effectiveCount).toBe(2);
    expect(result.limit).toBe(3);
  });

  it("blocks a free user with completed=2 and inFlight=1", async () => {
    mockCountInFlight.mockResolvedValue(1);
    const user = buildUserFixture("free", 2);

    const result = await checkGenerationEligibility(user);

    expect(result.allowed).toBe(false);
    expect(result.completedCount).toBe(2);
    expect(result.inFlightCount).toBe(1);
    expect(result.effectiveCount).toBe(3);
    expect(result.limit).toBe(3);
  });

  it("blocks a free user with completed=3 and inFlight=0", async () => {
    mockCountInFlight.mockResolvedValue(0);
    const user = buildUserFixture("free", 3);

    const result = await checkGenerationEligibility(user);

    expect(result.allowed).toBe(false);
    expect(result.completedCount).toBe(3);
    expect(result.inFlightCount).toBe(0);
    expect(result.effectiveCount).toBe(3);
    expect(result.limit).toBe(3);
  });

  it("allows a pro user regardless of usage", async () => {
    const user = buildUserFixture("pro", 25);

    const result = await checkGenerationEligibility(user);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Number.POSITIVE_INFINITY);
    expect(result.completedCount).toBe(25);
    expect(result.inFlightCount).toBe(0);
    expect(serializeAssignmentLimit("pro")).toBeNull();
    expect(mockCountInFlight).not.toHaveBeenCalled();
  });

  it("allows an enterprise user regardless of usage", async () => {
    const user = buildUserFixture("enterprise", 100);

    const result = await checkGenerationEligibility(user);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(Number.POSITIVE_INFINITY);
    expect(result.completedCount).toBe(100);
    expect(result.inFlightCount).toBe(0);
    expect(serializeAssignmentLimit("enterprise")).toBeNull();
    expect(mockCountInFlight).not.toHaveBeenCalled();
  });
});
