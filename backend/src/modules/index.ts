import { Router } from "express";
import assignmentRouter from "./assignment/assignment.routes";
import billingRouter from "./billing/billing.routes";
import healthRouter from "./health/health.routes";
import userRouter from "./user/user.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/assignments", assignmentRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/billing", billingRouter);

export default apiRouter;
