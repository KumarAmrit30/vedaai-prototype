import type { User } from "firebase/auth";

export function getUserDisplayName(user: User): string {
  return user.displayName?.trim() || user.email?.split("@")[0] || "User";
}

export function getUserInitials(user: User): string {
  const displayName = user.displayName?.trim();

  if (displayName) {
    const parts = displayName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }

    return displayName.slice(0, 2).toUpperCase();
  }

  const emailPrefix = user.email?.split("@")[0];

  if (emailPrefix) {
    return emailPrefix.slice(0, 2).toUpperCase();
  }

  return "U";
}
