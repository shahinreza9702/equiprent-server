import { Router } from "express";

import { equipmentController } from "./equipment.controller.js";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";

import imageUpload from "../../middlewares/image-upload.middleware.js";

const router = Router();

// Public: Get all available equipment
router.get("/", equipmentController.getAllEquipment);

// Owner only: Upload equipment image
router.post(
  "/upload-image",
  authMiddleware,
  authorizeRoles("owner"),
  imageUpload,
  equipmentController.uploadEquipmentImage,
);

// Owner only: Get owner's equipment
router.get(
  "/owner/my-equipment",
  authMiddleware,
  authorizeRoles("owner"),
  equipmentController.getOwnerEquipments,
);

// Private: Get equipment details by ID
router.get(
  "/:id",
  authMiddleware,
  equipmentController.getEquipmentById,
);

// Owner only - Update equipment
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  equipmentController.updateEquipment,
);

// Owner only - Delete equipment
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("owner"),
  equipmentController.deleteEquipment,
);

// Owner only: Create equipment
router.post(
  "/",
  authMiddleware,
  authorizeRoles("owner"),
  equipmentController.createEquipment,
);

export default router;
