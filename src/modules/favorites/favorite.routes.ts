import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/role.middleware.js";

import { favoriteController } from "./favorite.controller.js";

const router = Router();

// Get customer's favorites.
router.get(
  "/",
  authMiddleware,
  authorizeRoles("customer"),
  favoriteController.getMyFavorites,
);

// Add equipment to favorites.
router.post(
  "/:equipmentId",
  authMiddleware,
  authorizeRoles("customer"),
  favoriteController.addFavorite,
);

// Remove equipment from favorites.
router.delete(
  "/:equipmentId",
  authMiddleware,
  authorizeRoles("customer"),
  favoriteController.removeFavorite,
);

export default router;