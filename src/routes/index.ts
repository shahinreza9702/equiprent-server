import { Router } from "express";

import healthRoutes from "../modules/health/health.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

const router = Router();

// Health Check
router.use("/health", healthRoutes);

// User Routes
router.use("/users", usersRoutes);

// Authentication Routes
router.use("/auth", authRoutes);

export default router;