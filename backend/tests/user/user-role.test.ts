import { isAdmin, resolveUserRole } from "../../src/modules/user/user-role";

describe("user-role", () => {
  it("returns true only for admin role", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
    expect(isAdmin({ role: "user" })).toBe(false);
    expect(isAdmin({})).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("defaults missing role to user", () => {
    expect(resolveUserRole({})).toBe("user");
    expect(resolveUserRole(null)).toBe("user");
    expect(resolveUserRole({ role: "admin" })).toBe("admin");
  });
});
