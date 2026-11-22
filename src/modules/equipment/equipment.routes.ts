import { Router } from "express";

import { equipmentController } from "./equipment.controller.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";

const router = Router();

// Public: Get all available equipment
router.get("/", equipmentController.getAllEquipment);

// Private: Get equipment details by ID
router.get(
  "/:id",
  authMiddleware,
  equipmentController.getEquipmentById,
);

// Owner only: Create equipment
router.post(
  "/",
  authMiddleware,
  authorizeRoles("owner"),
  equipmentController.createEquipment,
);

export default router;
