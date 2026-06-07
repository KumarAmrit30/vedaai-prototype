import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { getFirebaseAuth } from "../config/firebase-admin";
import { upsertUserFromFirebaseClaims } from "../modules/user/user.service";
import { logWarn } from "../utils/logger";

export interface RequestAuth {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization?.trim();

  if (!header) return null;

  const [scheme, token] = header.split(/\s+/, 2);

  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token;
}

export async function verifyFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!env.authEnabled) {
    next();
    return;
  }

  const token = readBearerToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  try {
    const decoded = await getFirebaseAuth().verifyIdToken(token);

    const auth: RequestAuth = {
      uid: decoded.uid,
    };

    if (decoded.email) {
      auth.email = decoded.email;
    }

    if (typeof decoded.name === "string") {
      auth.name = decoded.name;
    } else {
      const displayName = (decoded as Record<string, unknown>).displayName;
      if (typeof displayName === "string") {
        auth.name = displayName;
      }
    }

    if (typeof decoded.picture === "string") {
      auth.picture = decoded.picture;
    }

    req.auth = auth;

    // Lazily provision / sync the user profile on each authenticated request.
    // Profile sync should never block access if the write fails transiently.
    try {
      await upsertUserFromFirebaseClaims(auth);
    } catch (error) {
      logWarn("Failed to upsert user from Firebase claims", {
        uid: auth.uid,
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }
}
