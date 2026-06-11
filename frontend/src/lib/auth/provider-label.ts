import type { User } from "firebase/auth";

const PROVIDER_LABELS: Record<string, string> = {
  "google.com": "Google",
  password: "Email & Password",
  "apple.com": "Apple",
  "github.com": "GitHub",
  "microsoft.com": "Microsoft",
};

export function getFirebaseProviderLabel(user: User): string {
  const providerId = user.providerData[0]?.providerId;

  if (!providerId) {
    return "Unknown";
  }

  return PROVIDER_LABELS[providerId] ?? providerId;
}
