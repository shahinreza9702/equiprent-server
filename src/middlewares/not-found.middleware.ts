
import type { RequestHandler } from "express";

// Handle requests to undefined routes
const notFound: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export default notFound;
