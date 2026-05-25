import { Router } from "express";
import assignmentRouter from "./assignment/assignment.routes";
import healthRouter from "./health/health.routes";
import testRouter from "./test/test.routes";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/test-job", testRouter);
apiRouter.use("/assignments", assignmentRouter);

export default apiRouter;
