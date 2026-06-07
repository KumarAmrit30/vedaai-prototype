import type { NextFunction, Request, Response } from "express";
import {
  findUserByFirebaseUid,
  upsertUserFromFirebaseClaims,
} from "./user.service";
import { serializeUserProfile } from "./user.serializer";

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const auth = req.auth;

    if (!auth?.uid) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const user =
      (await findUserByFirebaseUid(auth.uid)) ??
      (await upsertUserFromFirebaseClaims(auth));

    res.json({
      success: true,
      data: serializeUserProfile(user),
    });
  } catch (error) {
    next(error);
  }
}
