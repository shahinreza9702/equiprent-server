import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";

import { adminController } from "./admin.controller.js";

const router = Router();

// All admin routes require admin authentication
router.use(authMiddleware, authorizeRoles("admin"));

// Get users with search, filters and pagination
router.get("/users", adminController.getUsers);

// Update user account status
router.patch("/users/:id/status", adminController.updateUserStatus);

router.patch(
  "/owner-applications/:id/review",
  adminController.reviewOwnerApplication,
);

router.get(
  "/owner-applications",
  adminController.getOwnerApplications,
);

// Equipment Management
router.get("/equipments", adminController.getEquipments);

router.patch(
  "/equipments/:id/review",
  adminController.reviewEquipment,
);

export default router;
