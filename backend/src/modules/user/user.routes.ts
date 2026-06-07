import { Router } from "express";
import { verifyFirebaseToken } from "../../middleware/firebase-auth";
import { getCurrentUser } from "./user.controller";

const userRouter = Router();

userRouter.use(verifyFirebaseToken);

userRouter.get("/me", getCurrentUser);

export default userRouter;
