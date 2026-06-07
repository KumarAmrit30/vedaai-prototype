import cors from "cors";
import express from "express";
import { getCorsOrigins } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import apiRouter from "./modules/index";

const app = express();

// Render and other reverse proxies — required for accurate req.ip in rate limiters.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: getCorsOrigins(),
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
