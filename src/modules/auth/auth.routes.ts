
import { Router } from "express";

import { authController } from "./auth.controller.js";
import {
    forgotPasswordLimiter,
    resetPasswordLimiter,
} from "../../middlewares/rate-limit.middleware.js";

const router = Router();

router.post("/login", authController.loginUser);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logoutUser);

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
