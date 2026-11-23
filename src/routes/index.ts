import { Router } from "express";

import healthRoutes from "../modules/health/health.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import equipmentRoutes from "../modules/equipment/equipment.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import ownerApplicationRoutes from "../modules/owner-applications/owner-applications.routes.js";
import bookingRoutes from "../modules/bookings/booking.routes.js";

const router = Router();

// Health Check
router.use("/health", healthRoutes);

// User Routes
router.use("/users", usersRoutes);

// Authentication Routes
router.use("/auth", authRoutes);

// Equipment Routes
router.use("/equipments", equipmentRoutes);

// Owner Application Routes
router.use("/owner-applications", ownerApplicationRoutes);

// Booking Routes
router.use("/bookings", bookingRoutes);

// Admin Routes
router.use("/admin", adminRoutes);

export default router;
