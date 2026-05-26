import { Router } from "express";
import assignmentRouter from "./assignment/assignment.routes";
import healthRouter from "./health/health.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/assignments", assignmentRouter);

export default apiRouter;
