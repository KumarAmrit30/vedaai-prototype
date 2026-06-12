import { User } from "../../src/modules/user/user.model";
import { upsertUserFromFirebaseClaims } from "../../src/modules/user/user.service";

jest.mock("../../src/modules/user/user.model", () => ({
  User: {
    findOneAndUpdate: jest.fn(),
  },
}));

const mockFindOneAndUpdate = User.findOneAndUpdate as jest.MockedFunction<
  typeof User.findOneAndUpdate
>;

describe("upsertUserFromFirebaseClaims", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("writes profile fields only in $set and insert-only fields only in $setOnInsert", async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      firebaseUid: "firebase-uid-1",
      email: "teacher@school.edu",
      plan: "free",
    } as never);

    await upsertUserFromFirebaseClaims({
      uid: "firebase-uid-1",
      email: "teacher@school.edu",
      name: "Ada Teacher",
      picture: "https://example.com/photo.jpg",
    });

    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);

    const [, update, options] = mockFindOneAndUpdate.mock.calls[0] ?? [];
    const setFields = Object.keys(
      (update as { $set: Record<string, string> }).$set,
    );
    const setOnInsertFields = Object.keys(
      (update as { $setOnInsert: Record<string, unknown> }).$setOnInsert,
    );

    expect(setFields).toEqual(
      expect.arrayContaining(["email", "displayName", "photoURL"]),
    );
    expect(setOnInsertFields).toEqual(
      expect.arrayContaining(["firebaseUid", "plan", "subscription", "usage"]),
    );

    const overlap = setFields.filter((field) => setOnInsertFields.includes(field));
    expect(overlap).toEqual([]);

    expect((update as { $setOnInsert: Record<string, unknown> }).$setOnInsert).not.toHaveProperty(
      "email",
    );
    expect(options).toEqual({
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    });
  });

  it("uses a fallback email when Firebase claims omit email", async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      firebaseUid: "firebase-uid-2",
      email: "firebase-uid-2@users.examforge.internal",
      plan: "free",
    } as never);

    await upsertUserFromFirebaseClaims({
      uid: "firebase-uid-2",
    });

    const [, update] = mockFindOneAndUpdate.mock.calls[0] ?? [];

    expect((update as { $set: { email: string } }).$set.email).toBe(
      "firebase-uid-2@users.examforge.internal",
    );
    expect(
      (update as { $setOnInsert: Record<string, unknown> }).$setOnInsert,
    ).not.toHaveProperty("email");
  });
});
