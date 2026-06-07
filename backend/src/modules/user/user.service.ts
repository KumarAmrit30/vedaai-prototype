import { User, type UserDocument } from "./user.model";

export interface FirebaseUserClaims {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Lazily provisions a user on first authenticated request and keeps profile
 * fields in sync on subsequent requests. Never resets plan or usage.
 */
export async function upsertUserFromFirebaseClaims(
  claims: FirebaseUserClaims,
): Promise<UserDocument> {
  const email =
    claims.email?.trim().toLowerCase() ??
    `${claims.uid}@users.examforge.internal`;

  const profileUpdate: Record<string, string> = { email };

  if (claims.name?.trim()) {
    profileUpdate.displayName = claims.name.trim();
  }

  if (claims.picture?.trim()) {
    profileUpdate.photoURL = claims.picture.trim();
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid: claims.uid },
    {
      $set: profileUpdate,
      $setOnInsert: {
        firebaseUid: claims.uid,
        email,
        plan: "free",
        usage: { assignmentsGenerated: 0 },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  if (!user) {
    throw new Error(`Failed to upsert user for uid ${claims.uid}`);
  }

  return user;
}

export async function findUserByFirebaseUid(
  uid: string,
): Promise<UserDocument | null> {
  return User.findOne({ firebaseUid: uid });
}

/** Atomically increments the generation counter after successful completion. */
export async function incrementAssignmentUsage(uid: string): Promise<void> {
  const result = await User.updateOne(
    { firebaseUid: uid },
    { $inc: { "usage.assignmentsGenerated": 1 } },
  );

  if (result.matchedCount === 0) {
    throw new Error(`Cannot increment usage — user not found for uid ${uid}`);
  }
}
