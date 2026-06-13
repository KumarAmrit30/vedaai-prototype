"use client";

import Image from "next/image";
import { BRAND_NAME, BRAND_TAGLINE, BRANDING } from "@/lib/branding";
import { useTheme } from "@/providers/theme-provider";

type LogoVariant = "sidebar" | "sidebar-icon" | "navbar" | "auth" | "about";

interface ExamForgeLogoProps {
  variant?: LogoVariant;
  className?: string;
  showTagline?: boolean;
}

function BrandWordmark({
  showTagline = true,
  className = "",
}: {
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={`sidebar-shell__brand-text min-w-0 ${className}`}>
      <p className="truncate text-[14px] font-semibold leading-none tracking-[-0.02em] text-[var(--text-primary)]">
        {BRAND_NAME}
      </p>
      {showTagline ? (
        <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
          {BRAND_TAGLINE}
        </p>
      ) : null}
    </div>
  );
}

export function ExamForgeLogo({
  variant = "sidebar",
  className = "",
  showTagline = true,
}: ExamForgeLogoProps) {
  const { resolved } = useTheme();

  if (variant === "sidebar-icon") {
    return (
      <Image
        src={BRANDING.icon}
        alt=""
        width={28}
        height={28}
        className={`sidebar-shell__logo h-7 w-7 shrink-0 rounded-[9px] object-cover ${className}`}
        priority
      />
    );
  }

  if (variant === "auth") {
    return (
      <Image
        src={BRANDING.logoDark}
        alt={BRAND_NAME}
        width={220}
        height={120}
        className={`mx-auto h-auto w-full max-w-[220px] object-contain ${className}`}
        priority
      />
    );
  }

  if (variant === "about") {
    return (
      <Image
        src={resolved === "dark" ? BRANDING.logoDark : BRANDING.logoPrimary}
        alt={BRAND_NAME}
        width={200}
        height={48}
        className={`h-10 w-auto object-contain object-left ${className}`}
      />
    );
  }

  if (variant === "navbar") {
    if (resolved === "light") {
      return (
        <Image
          src={BRANDING.logoPrimary}
          alt={BRAND_NAME}
          width={140}
          height={32}
          className={`h-8 w-auto max-w-[140px] object-contain object-left ${className}`}
          priority
        />
      );
    }

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Image
          src={BRANDING.icon}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-[10px] object-cover"
          priority
        />
        <BrandWordmark showTagline={false} className="sidebar-shell__brand-text--navbar" />
      </div>
    );
  }

  // Sidebar: icon-only on tablet rail; full logo on desktop light; icon + wordmark on desktop dark.
  return (
    <div className={`sidebar-shell__brand flex items-center gap-2 ${className}`}>
      <Image
        src={BRANDING.icon}
        alt=""
        width={28}
        height={28}
        className="sidebar-shell__logo sidebar-shell__logo--icon h-7 w-7 shrink-0 rounded-[9px] object-cover"
        priority
      />

      {resolved === "light" ? (
        <Image
          src={BRANDING.logoPrimary}
          alt={BRAND_NAME}
          width={168}
          height={36}
          className="sidebar-shell__logo-image h-9 w-auto max-w-[168px] object-contain object-left"
          priority
        />
      ) : (
        <BrandWordmark showTagline={showTagline} />
      )}
    </div>
  );
}
