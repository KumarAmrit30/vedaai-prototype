import type { User } from "./user.types";

export function isAdmin(user?: Pick<User, "role"> | null): boolean {
  return user?.role === "admin";
}

export function resolveUserRole(user?: Pick<User, "role"> | null): User["role"] {
  return user?.role ?? "user";
}
