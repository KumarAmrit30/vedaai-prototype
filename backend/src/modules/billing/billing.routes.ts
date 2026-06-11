import { Router } from "express";
import { verifyFirebaseToken } from "../../middleware/firebase-auth";
import { getBillingPlans, getCurrentPlan } from "./billing.controller";

const billingRouter = Router();

billingRouter.get("/plans", getBillingPlans);

billingRouter.get("/current-plan", verifyFirebaseToken, getCurrentPlan);

export default billingRouter;
