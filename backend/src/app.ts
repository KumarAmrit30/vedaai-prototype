import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import apiRouter from "./modules/index";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
