import { Router } from "express";

import { usersController } from "./users.controller.js";

const router = Router();

// Register user
router.post("/register", usersController.registerUser);

export default router;