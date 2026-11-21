import { Router } from "express";

import { usersController } from "./users.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = Router();

// Register user
router.post("/register", usersController.registerUser);

// Get authenticated user's profile
router.get("/me", authMiddleware, usersController.getMyProfile);

// Update authenticated user's profile
router.patch("/me", authMiddleware, usersController.updateMyProfile);

export default router;