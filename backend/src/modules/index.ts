import { Router } from "express";
import assignmentRouter from "./assignment/assignment.routes";
import healthRouter from "./health/health.routes";
import userRouter from "./user/user.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/assignments", assignmentRouter);
apiRouter.use("/users", userRouter);

export default apiRouter;
