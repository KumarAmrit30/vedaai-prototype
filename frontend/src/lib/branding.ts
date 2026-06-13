/** Public branding asset paths (served from /public/branding). */
export const BRANDING = {
  logoPrimary: "/branding/logo-primary.png",
  logoDark: "/branding/logo-dark.png",
  logoMonochrome: "/branding/logo-monochrome.png",
  /** EF icon-only mark (1024×1024) — used in sidebar, navbar, and UI. */
  icon: "/branding/icon.png",
} as const;

/** App Router metadata icons (generated in src/app/ from BRANDING.icon). */
export const APP_ICONS = {
  favicon: "/favicon.ico",
  icon: "/icon.png",
  apple: "/apple-icon.png",
} as const;

export const BRAND_NAME = "ExamForge AI";
export const BRAND_TAGLINE = "Exam Generation Platform";
