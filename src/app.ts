
import express from "express";
import cors from "cors";
import { createRequire } from "node:module";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import apiRoutes from "./routes/index.js";
import notFound from "./middlewares/not-found.middleware.js";
import globalErrorHandler from "./middlewares/global-error.middleware.js";

import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";

import { paymentWebhookController } from "./modules/payments/payment.webhook.controller.js";

// Load Helmet through Node.js CommonJS interoperability.
const require = createRequire(import.meta.url);

const helmet = require("helmet") as (
  options?: Record<string, unknown>,
) => import("express").RequestHandler;

const app = express();

// Security middleware.
app.use(helmet());

// CORS configuration.
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

// HTTP request logger.
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// Stripe webhook must receive the original raw request body.
// This route must be registered before express.json().
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  async (_req, _res, next) => {
    try {
      await connectDatabase();
      next();
    } catch (error) {
      next(error);
    }
  },
  paymentWebhookController.handleStripeWebhook,
);

// Standard request body parsers.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser.
app.use(cookieParser());

// Ensure database connection before handling normal API requests.
app.use("/api", async (_req, _res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// API routes.
app.use("/api", apiRoutes);

// Root route.
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to EquipRent API",
  });
});

// Handle undefined routes.
app.use(notFound);

// Handle application errors.
app.use(globalErrorHandler);

export default app;
