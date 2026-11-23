
import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";

import {
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from "../../middlewares/rate-limit.middleware.js";

import { authController } from "./auth.controller.js";

const router = Router();

router.post("/login", authController.loginUser);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logoutUser);

router.patch(
  "/change-password",
  authMiddleware,
  authController.changePassword,
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  authController.resetPassword,
);

export default router;
