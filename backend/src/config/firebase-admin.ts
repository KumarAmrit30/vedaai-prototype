import admin from "firebase-admin";
import { env } from "./env";

let initialized = false;

export function initFirebaseAdmin(): void {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  if (!env.authEnabled) {
    return;
  }

  if (!env.firebaseProjectId || !env.firebaseClientEmail || !env.firebasePrivateKey) {
    throw new Error(
      "[FIREBASE] AUTH_ENABLED=true requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
    }),
  });

  initialized = true;
}

export function getFirebaseAuth(): admin.auth.Auth {
  initFirebaseAdmin();

  if (!admin.apps.length) {
    throw new Error("[FIREBASE] Firebase Admin is not initialized.");
  }

  return admin.auth();
}
