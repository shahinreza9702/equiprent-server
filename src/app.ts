
import express from "express";
import cors from "cors";
import helmetModule from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index.js";
import notFound from "./middlewares/not-found.middleware.js";
import globalErrorHandler from "./middlewares/global-error.middleware.js";


import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

const app = express();

const helmet = helmetModule as unknown as (
  options?: Record<string, unknown>,
) => import("express").RequestHandler;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// Request body parsers
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// HTTP request logger
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// Ensure database connection before handling API requests
app.use("/api", async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use("/api", apiRoutes);

// Root route
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to EquipRent API",
  });
});

// Handle undefined routes
app.use(notFound);

// Handle application errors
app.use(globalErrorHandler);

export default app;
