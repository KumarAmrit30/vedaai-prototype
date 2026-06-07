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
  const profileUpdate: Record<string, string> = {};

  if (claims.email) profileUpdate.email = claims.email;
  if (claims.name) profileUpdate.displayName = claims.name;
  if (claims.picture) profileUpdate.photoURL = claims.picture;

  const user = await User.findOneAndUpdate(
    { firebaseUid: claims.uid },
    {
      $set: profileUpdate,
      $setOnInsert: {
        firebaseUid: claims.uid,
        plan: "free",
        usage: { assignmentsGenerated: 0 },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return user;
}

export async function findUserByFirebaseUid(
  uid: string,
): Promise<UserDocument | null> {
  return User.findOne({ firebaseUid: uid });
}

/** Atomically increments the generation counter after a successful create. */
export async function incrementAssignmentUsage(uid: string): Promise<void> {
  await User.updateOne(
    { firebaseUid: uid },
    { $inc: { "usage.assignmentsGenerated": 1 } },
  );
}
