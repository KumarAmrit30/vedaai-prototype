"use client";

import type { FirebaseError } from "firebase/app";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

function formatAuthError(error: unknown): { code: string; message: string } {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as FirebaseError).code === "string"
  ) {
    const firebaseError = error as FirebaseError;
    return {
      code: firebaseError.code,
      message: firebaseError.message,
    };
  }

  return {
    code: "unknown",
    message:
      error instanceof Error ? error.message : "Unable to sign in with Google.",
  };
}

function GoogleIcon(): React.ReactNode {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginContent(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = useAuthStore((state) => state.status);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const nextPath = searchParams.get("next") || "/";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  async function handleGoogleSignIn(): Promise<void> {
    if (isSigningIn) return;

    setIsSigningIn(true);

    try {
      await signInWithGoogle();
      router.replace(nextPath);
    } catch (error) {
      console.error("[AUTH] Google Sign-In failed", error);

      const { code, message } = formatAuthError(error);
      toast.error(`${code}: ${message}`);
    } finally {
      setIsSigningIn(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-12">
        <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="surface-card-compact px-8 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--black-primary)] text-sm font-bold text-white">
            E
          </div>

          <h1 className="mt-5 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            ExamForge AI
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            AI-powered assessment generation for educators. Sign in to access your
            workspace.
          </p>

          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSigningIn}
            className="submit-pill-btn mt-8 inline-flex w-full items-center justify-center gap-3"
            aria-busy={isSigningIn}
          >
            {isSigningIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>{isSigningIn ? "Signing in..." : "Continue with Google"}</span>
          </button>

          <p className="mt-6 text-[12px] text-[var(--text-muted)]">
            Secure Google authentication powered by Firebase.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage(): React.ReactNode {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center px-4 py-12">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
