import { Router } from "express";
import { createTestJob } from "./test.controller";

const testRouter = Router();

testRouter.post("/", createTestJob);

export default testRouter;
