import { Router } from "express";

import healthRoutes from "../modules/health/health.routes.js";
import usersRoutes from "../modules/users/users.routes.js";

const router = Router();

// Health Check
router.use("/health", healthRoutes);

// User Routes
router.use("/users", usersRoutes);


export default router;
