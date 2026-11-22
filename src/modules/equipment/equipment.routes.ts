import { Router } from "express";

import { equipmentController } from "./equipment.controller.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";

const router = Router();

// Public: Get all available equipment
router.get("/", equipmentController.getAllEquipment);

// Owner only: Create equipment
router.post(
  "/",
  authMiddleware,
  authorizeRoles("owner"),
  equipmentController.createEquipment,
);

export default router;
