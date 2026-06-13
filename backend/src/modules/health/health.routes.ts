import { Router } from "express";
import { getAIHealth, getHealth } from "./health.controller";

const healthRouter = Router();

healthRouter.get("/", getHealth);
healthRouter.get("/ai", getAIHealth);

export default healthRouter;
