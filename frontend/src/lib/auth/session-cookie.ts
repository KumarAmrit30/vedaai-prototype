export const AUTH_SESSION_COOKIE = "ef-auth-session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function setAuthSessionCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_SESSION_COOKIE}=1; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthSessionCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
