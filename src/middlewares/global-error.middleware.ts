
import type { ErrorRequestHandler } from "express";

import { env } from "../config/env.js";

// Handle application errors globally
const globalErrorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  const isProduction = env.NODE_ENV === "production";

  // Extract a valid HTTP status code
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number" &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
      ? error.statusCode
      : 500;

  const isOperationalError =
    typeof error === "object" &&
    error !== null &&
    "isOperational" in error &&
    error.isOperational === true;

  const message =
    isProduction && (!isOperationalError || statusCode >= 500)
      ? "Internal server error"
      : error instanceof Error
        ? error.message
        : "Internal server error";

  // Log errors outside production
  if (!isProduction) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProduction && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });
};

export default globalErrorHandler;
