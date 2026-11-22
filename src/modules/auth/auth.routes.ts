
import { Router } from "express";

import { authController } from "./auth.controller.js";

const router = Router();

router.post("/login", authController.loginUser);
router.post("/refresh", authController.refreshToken);

export default router;
