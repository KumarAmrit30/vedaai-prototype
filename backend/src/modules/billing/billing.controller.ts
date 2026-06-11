import type { NextFunction, Request, Response } from "express";
import {
  findUserByFirebaseUid,
  upsertUserFromFirebaseClaims,
} from "../user/user.service";
import {
  serializeCurrentPlan,
  serializePlanCatalog,
} from "./billing.serializer";

export function getBillingPlans(
  _req: Request,
  res: Response,
): void {
  res.json({
    success: true,
    data: serializePlanCatalog(),
  });
}

export async function getCurrentPlan(
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
      data: serializeCurrentPlan(user),
    });
  } catch (error) {
    next(error);
  }
}
